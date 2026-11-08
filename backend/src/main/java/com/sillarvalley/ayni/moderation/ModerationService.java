package com.sillarvalley.ayni.moderation;

import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.PageResponse;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostDtos;
import com.sillarvalley.ayni.post.PostMapper;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserDtos;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModerationService {

    private final PostRepository posts;
    private final ReportRepository reports;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final PostMapper mapper;
    private final Locations locations;

    public ModerationService(PostRepository posts, ReportRepository reports, UserRepository users,
                             CurrentUser currentUser, PostMapper mapper, Locations locations) {
        this.posts = posts;
        this.reports = reports;
        this.users = users;
        this.currentUser = currentUser;
        this.mapper = mapper;
        this.locations = locations;
    }

    @Transactional(readOnly = true)
    public PageResponse<PostDtos.PostResponse> listByStatus(Long uid, PostStatus status, int page, int size) {
        requireModerator(uid);
        var result = posts.findByStatusOrderByCreatedAtAsc(status,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
        return PageResponse.of(result, p -> mapper.toDto(p, true));
    }

    @Transactional
    public PostDtos.PostResponse approve(Long uid, Long postId) {
        User mod = requireModerator(uid);
        Post p = findPending(postId);
        p.setStatus(PostStatus.APPROVED);
        p.setModeratedBy(mod);
        p.setModerationNote(null);
        return mapper.toDto(p, true);
    }

    @Transactional
    public PostDtos.PostResponse reject(Long uid, Long postId, String note) {
        User mod = requireModerator(uid);
        Post p = findPending(postId);
        p.setStatus(PostStatus.REJECTED);
        p.setModeratedBy(mod);
        p.setModerationNote(note.trim());
        return mapper.toDto(p, true);
    }

    @Transactional
    public ModerationDtos.ReportDto report(Long uid, Long postId, String reason) {
        User user = currentUser.require(uid);
        Post p = posts.findById(postId).orElseThrow(() -> ApiException.notFound("Publicación no encontrada"));
        if (p.getStatus() != PostStatus.APPROVED) {
            throw ApiException.conflict("Solo se pueden reportar publicaciones activas");
        }
        if (p.getAuthor().getId().equals(uid)) {
            throw ApiException.badRequest("No puedes reportar tu propia publicación");
        }
        if (reports.existsByPostIdAndReporterIdAndStatus(postId, uid, ReportStatus.OPEN)) {
            throw ApiException.conflict("Ya reportaste esta publicación");
        }
        Report r = new Report();
        r.setPost(p);
        r.setReporter(user);
        r.setReason(reason.trim());
        return toDto(reports.save(r));
    }

    @Transactional(readOnly = true)
    public PageResponse<ModerationDtos.ReportDto> listReports(Long uid, ReportStatus status, int page, int size) {
        requireModerator(uid);
        var result = reports.findByStatusOrderByCreatedAtAsc(status,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
        return PageResponse.of(result, this::toDto);
    }

    @Transactional
    public ModerationDtos.ReportDto resolve(Long uid, Long reportId, boolean removePost, String note) {
        User mod = requireModerator(uid);
        Report r = reports.findById(reportId).orElseThrow(() -> ApiException.notFound("Reporte no encontrado"));
        if (r.getStatus() != ReportStatus.OPEN) {
            throw ApiException.conflict("El reporte ya fue atendido");
        }
        if (removePost) {
            Post p = r.getPost();
            if (p.getStatus() == PostStatus.APPROVED) {
                p.setStatus(PostStatus.REJECTED);
                p.setModeratedBy(mod);
                p.setModerationNote(note == null || note.isBlank() ? "Retirada por reporte de la comunidad" : note.trim());
            }
            r.setStatus(ReportStatus.RESOLVED);
        } else {
            r.setStatus(ReportStatus.DISMISSED);
        }
        r.setResolutionNote(note == null || note.isBlank() ? null : note.trim());
        r.setResolvedBy(mod);
        r.setResolvedAt(Instant.now());
        return toDto(r);
    }

    @Transactional(readOnly = true)
    public List<UserDtos.UserResponse> listUsers(Long uid) {
        requireModerator(uid);
        return users.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(u -> UserDtos.UserResponse.of(u, locations.of(u))).toList();
    }

    @Transactional
    public UserDtos.UserResponse setActive(Long uid, Long targetId, boolean active) {
        requireModerator(uid);
        if (uid.equals(targetId)) {
            throw ApiException.badRequest("No puedes cambiar el estado de tu propia cuenta");
        }
        User target = users.findById(targetId).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        if (target.getRole() == Role.MODERATOR) {
            throw ApiException.forbidden("No se puede desactivar a otro moderador");
        }
        target.setActive(active);
        return UserDtos.UserResponse.of(target, locations.of(target));
    }

    private User requireModerator(Long uid) {
        User u = currentUser.require(uid);
        if (u.getRole() != Role.MODERATOR) {
            throw ApiException.forbidden("Solo los moderadores pueden hacer esto");
        }
        return u;
    }

    private Post findPending(Long postId) {
        Post p = posts.findById(postId).orElseThrow(() -> ApiException.notFound("Publicación no encontrada"));
        if (p.getStatus() != PostStatus.PENDING) {
            throw ApiException.conflict("La publicación no está pendiente de moderación");
        }
        return p;
    }

    private ModerationDtos.ReportDto toDto(Report r) {
        return new ModerationDtos.ReportDto(r.getId(), r.getPost().getId(), r.getPost().getTitle(),
                UserDtos.UserSummary.of(r.getReporter()), r.getReason(), r.getStatus(),
                r.getResolutionNote(), r.getCreatedAt(), r.getResolvedAt());
    }
}
