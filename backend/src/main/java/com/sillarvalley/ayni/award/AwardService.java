package com.sillarvalley.ayni.award;

import com.sillarvalley.ayni.moderation.ModerationDtos;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserDtos;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AwardService {

    public static final int POINTS_PER_HELP = 10;
    public static final int DAILY_POINTED_HELPS = 5;
    public static final int POINTED_HELPS_PER_PAIR = 1;
    public static final Duration PAIR_WINDOW = Duration.ofDays(30);
    public static final Duration MIN_BEFORE_FULFILL = Duration.ofMinutes(10);
    public static final Duration CONFIRM_DEADLINE = Duration.ofDays(7);
    public static final int RING_THRESHOLD = 3;
    public static final int CAPPED_DAYS_THRESHOLD = 2;

    private static final Duration CAP_WINDOW = Duration.ofDays(7);

    public record Result(int points, AwardLimit limit) {
        public String message() {
            if (limit != null) {
                return limit.message();
            }
            return "¡Gracias! Sumaste " + points + " puntos ayni.";
        }
    }

    private final HelpAwardRepository awards;
    private final PostRepository posts;

    public AwardService(HelpAwardRepository awards, PostRepository posts) {
        this.awards = awards;
        this.posts = posts;
    }

    @Transactional
    public Result award(Post post, User helper, User receiver) {
        Instant now = Instant.now();
        AwardLimit limit = null;
        if (awards.countByHelperIdAndPointsGreaterThanAndCreatedAtAfter(
                helper.getId(), 0, now.minus(Duration.ofDays(1))) >= DAILY_POINTED_HELPS) {
            limit = AwardLimit.DAILY_LIMIT;
        } else if (awards.countPointsBetween(helper.getId(), receiver.getId(), now.minus(PAIR_WINDOW))
                >= POINTED_HELPS_PER_PAIR) {
            limit = AwardLimit.PAIR_LIMIT;
        }
        int points = limit == null ? POINTS_PER_HELP : 0;

        HelpAward a = new HelpAward();
        a.setPost(post);
        a.setHelper(helper);
        a.setReceiver(receiver);
        a.setPoints(points);
        a.setReason(limit);
        awards.save(a);

        helper.setHelpGiven(helper.getHelpGiven() + 1);
        helper.setAyniPoints(helper.getAyniPoints() + points);
        receiver.setHelpReceived(receiver.getHelpReceived() + 1);
        return new Result(points, limit);
    }

    @Transactional
    @Scheduled(initialDelay = 60_000, fixedDelay = 3_600_000)
    public int expireUnconfirmed() {
        List<Post> stale = posts.findByStatusAndFulfilledAtBefore(PostStatus.TO_CONFIRM,
                Instant.now().minus(CONFIRM_DEADLINE));
        stale.forEach(p -> p.setStatus(PostStatus.FULFILLED));
        return stale.size();
    }

    @Transactional(readOnly = true)
    public List<ModerationDtos.AbuseAlertDto> alerts() {
        Instant now = Instant.now();
        List<HelpAward> recent = awards.findSince(now.minus(PAIR_WINDOW));
        List<ModerationDtos.AbuseAlertDto> out = new ArrayList<>();
        out.addAll(ringAlerts(recent));
        out.addAll(cappedAlerts(recent, now.minus(CAP_WINDOW)));
        out.sort(Comparator.comparingInt(ModerationDtos.AbuseAlertDto::count).reversed());
        return out;
    }

    private List<ModerationDtos.AbuseAlertDto> ringAlerts(List<HelpAward> recent) {
        Map<String, List<HelpAward>> byPair = new HashMap<>();
        for (HelpAward a : recent) {
            long low = Math.min(a.getHelper().getId(), a.getReceiver().getId());
            long high = Math.max(a.getHelper().getId(), a.getReceiver().getId());
            byPair.computeIfAbsent(low + ":" + high, k -> new ArrayList<>()).add(a);
        }
        List<ModerationDtos.AbuseAlertDto> out = new ArrayList<>();
        for (List<HelpAward> group : byPair.values()) {
            if (group.size() < RING_THRESHOLD) {
                continue;
            }
            User first = group.get(0).getHelper();
            User second = group.get(0).getReceiver();
            out.add(new ModerationDtos.AbuseAlertDto(
                    "RING",
                    first.getFullName() + " y " + second.getFullName(),
                    "Se confirmaron " + group.size() + " ayudas entre ellos en los últimos 30 días.",
                    List.of(UserDtos.UserSummary.of(first), UserDtos.UserSummary.of(second)),
                    group.size()));
        }
        return out;
    }

    private List<ModerationDtos.AbuseAlertDto> cappedAlerts(List<HelpAward> recent, Instant since) {
        Map<Long, Set<java.time.LocalDate>> daysByUser = new HashMap<>();
        Map<Long, User> users = new HashMap<>();
        for (HelpAward a : recent) {
            if (a.getReason() != AwardLimit.DAILY_LIMIT || a.getCreatedAt().isBefore(since)) {
                continue;
            }
            Long id = a.getHelper().getId();
            users.put(id, a.getHelper());
            daysByUser.computeIfAbsent(id, k -> new HashSet<>())
                    .add(a.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate());
        }
        List<ModerationDtos.AbuseAlertDto> out = new ArrayList<>();
        daysByUser.forEach((id, days) -> {
            if (days.size() >= CAPPED_DAYS_THRESHOLD) {
                User u = users.get(id);
                out.add(new ModerationDtos.AbuseAlertDto(
                        "CAPPED",
                        u.getFullName(),
                        "Llegó al máximo diario de puntos en " + days.size() + " días de la última semana.",
                        List.of(UserDtos.UserSummary.of(u)),
                        days.size()));
            }
        });
        return out;
    }
}
