package com.sillarvalley.ayni.post;

import com.sillarvalley.ayni.award.AwardService;
import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.GeoPoint;
import com.sillarvalley.ayni.common.PageResponse;
import com.sillarvalley.ayni.common.RichText;
import com.sillarvalley.ayni.response.HelpResponse;
import com.sillarvalley.ayni.response.HelpResponseRepository;
import com.sillarvalley.ayni.response.HelpStatus;
import com.sillarvalley.ayni.review.AutoReview;
import com.sillarvalley.ayni.review.ReviewQueue;
import com.sillarvalley.ayni.review.ReviewSubject;
import com.sillarvalley.ayni.storage.StorageService;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import jakarta.persistence.criteria.Predicate;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    private final PostRepository posts;
    private final HelpResponseRepository responses;
    private final CurrentUser currentUser;
    private final StorageService storage;
    private final PostMapper mapper;
    private final Locations locations;
    private final ReviewQueue reviews;

    public PostService(PostRepository posts, HelpResponseRepository responses, CurrentUser currentUser,
                       StorageService storage, PostMapper mapper, Locations locations, ReviewQueue reviews) {
        this.posts = posts;
        this.responses = responses;
        this.currentUser = currentUser;
        this.storage = storage;
        this.mapper = mapper;
        this.locations = locations;
        this.reviews = reviews;
    }

    @Transactional
    public PostDtos.PostResponse create(Long uid, PostDtos.PostRequest req) {
        User user = currentUser.require(uid);
        Post p = new Post();
        p.setAuthor(user);
        apply(p, req);
        p.setStatus(user.getRole() == Role.MODERATOR ? PostStatus.APPROVED : PostStatus.PENDING);
        posts.save(p);
        queueReview(p);
        return mapper.toDto(p, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostDtos.PostResponse> search(Long uid, PostType type, Category category, String q,
                                                      int page, int size) {
        currentUser.require(uid);
        Specification<Post> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("status"), PostStatus.APPROVED));
            if (type != null) {
                ps.add(cb.equal(root.get("type"), type));
            }
            if (category != null) {
                ps.add(cb.equal(root.get("category"), category));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase().replace("%", "").replace("_", "") + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.<String>get("title")), like),
                        cb.like(cb.lower(root.<String>get("description")), like)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        var result = posts.findAll(spec, pageRequest(page, size));
        return PageResponse.of(result, p -> mapper.toDto(p, false));
    }

    @Transactional(readOnly = true)
    public PageResponse<PostDtos.PostResponse> mine(Long uid, int page, int size) {
        currentUser.require(uid);
        var result = posts.findByAuthorIdOrderByCreatedAtDesc(uid,
                PageRequest.of(Math.max(page, 0), clamp(size)));
        return PageResponse.of(result, p -> mapper.toDto(p, true));
    }

    @Transactional(readOnly = true)
    public PostDtos.PostResponse get(Long uid, Long id) {
        User user = currentUser.require(uid);
        Post p = find(id);
        boolean privileged = isOwner(p, uid) || user.getRole() == Role.MODERATOR;
        if (p.getStatus() != PostStatus.APPROVED && !privileged) {
            throw ApiException.notFound("Publicación no encontrada");
        }
        return mapper.toDto(p, privileged);
    }

    @Transactional
    public PostDtos.PostResponse update(Long uid, Long id, PostDtos.PostRequest req) {
        User user = currentUser.require(uid);
        Post p = find(id);
        if (!isOwner(p, uid)) {
            throw ApiException.forbidden("Solo el autor puede editar la publicación");
        }
        if (p.getStatus() == PostStatus.FULFILLED || p.getStatus() == PostStatus.CANCELLED
                || p.getStatus() == PostStatus.TO_CONFIRM) {
            throw ApiException.conflict("Esta publicación ya no se puede editar");
        }
        apply(p, req);
        p.setStatus(user.getRole() == Role.MODERATOR ? PostStatus.APPROVED : PostStatus.PENDING);
        p.setModerationNote(null);
        p.setAutoReview(null);
        p.setAutoReviewNote(null);
        queueReview(p);
        return mapper.toDto(p, true);
    }

    @Transactional
    public PostDtos.PostResponse cancel(Long uid, Long id) {
        User user = currentUser.require(uid);
        Post p = find(id);
        if (!isOwner(p, uid) && user.getRole() != Role.MODERATOR) {
            throw ApiException.forbidden("No puedes cancelar esta publicación");
        }
        if (p.getStatus() == PostStatus.FULFILLED || p.getStatus() == PostStatus.TO_CONFIRM) {
            throw ApiException.conflict("Una publicación cumplida no se puede cancelar");
        }
        p.setStatus(PostStatus.CANCELLED);
        return mapper.toDto(p, true);
    }

    @Transactional
    public PostDtos.PostResponse fulfill(Long uid, Long id) {
        currentUser.require(uid);
        Post p = find(id);
        if (!isOwner(p, uid)) {
            throw ApiException.forbidden("Solo el autor puede marcar la publicación como cumplida");
        }
        if (p.getStatus() != PostStatus.APPROVED) {
            throw ApiException.conflict("Solo una publicación aprobada puede marcarse como cumplida");
        }
        HelpResponse accepted = responses.findFirstByPostIdAndStatus(id, HelpStatus.ACCEPTED)
                .orElseThrow(() -> ApiException.conflict("Primero debes aceptar una respuesta"));

        Instant now = Instant.now();
        Instant acceptedAt = accepted.getAcceptedAt();
        if (acceptedAt != null && Duration.between(acceptedAt, now).compareTo(AwardService.MIN_BEFORE_FULFILL) < 0) {
            long minutes = AwardService.MIN_BEFORE_FULFILL.toMinutes();
            throw ApiException.conflict("Espera al menos " + minutes + " minutos desde que aceptaste la respuesta");
        }

        p.setStatus(PostStatus.TO_CONFIRM);
        p.setFulfilledAt(now);
        return mapper.toDto(p, true);
    }

    private void apply(Post p, PostDtos.PostRequest req) {
        p.setType(req.type());
        p.setCategory(req.category());
        p.setTitle(req.title().trim());
        String description = RichText.clean(req.description());
        p.setDescription(description.isEmpty() ? p.getTitle() : description);
        GeoPoint where = locations.pick(p.getAuthor(), req.addressId(), req.latitude(), req.longitude());
        p.setNeighborhood(where.neighborhood());
        p.setLatitude(where.latitude());
        p.setLongitude(where.longitude());
        List<String> images = req.images() == null ? List.of() : req.images();
        for (String name : images) {
            if (!storage.exists(name)) {
                throw ApiException.badRequest("La imagen '" + name + "' no existe. Súbela primero en /api/uploads");
            }
        }
        p.setImages(new ArrayList<>(images));
    }

    private void queueReview(Post p) {
        if (p.getStatus() == PostStatus.PENDING && reviews.enqueue(ReviewSubject.POST, p.getId())) {
            p.setAutoReview(AutoReview.QUEUED);
        }
    }

    private Post find(Long id) {
        return posts.findById(id).orElseThrow(() -> ApiException.notFound("Publicación no encontrada"));
    }

    private static boolean isOwner(Post p, Long uid) {
        return p.getAuthor().getId().equals(uid);
    }

    private static int clamp(int size) {
        return Math.min(Math.max(size, 1), 50);
    }

    private static PageRequest pageRequest(int page, int size) {
        return PageRequest.of(Math.max(page, 0), clamp(size), Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
