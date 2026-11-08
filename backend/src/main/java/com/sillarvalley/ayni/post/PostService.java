package com.sillarvalley.ayni.post;

import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.PageResponse;
import com.sillarvalley.ayni.response.HelpResponse;
import com.sillarvalley.ayni.response.HelpResponseRepository;
import com.sillarvalley.ayni.response.HelpStatus;
import com.sillarvalley.ayni.storage.StorageService;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    /** Puntos "ayni" que gana quien ayuda cuando la publicación se marca como cumplida. */
    public static final int POINTS_PER_HELP = 10;

    private final PostRepository posts;
    private final HelpResponseRepository responses;
    private final CurrentUser currentUser;
    private final StorageService storage;
    private final PostMapper mapper;

    public PostService(PostRepository posts, HelpResponseRepository responses, CurrentUser currentUser,
                       StorageService storage, PostMapper mapper) {
        this.posts = posts;
        this.responses = responses;
        this.currentUser = currentUser;
        this.storage = storage;
        this.mapper = mapper;
    }

    @Transactional
    public PostDtos.PostResponse create(Long uid, PostDtos.PostRequest req) {
        User user = currentUser.require(uid);
        Post p = new Post();
        p.setAuthor(user);
        apply(p, req);
        // Los vecinos pasan por moderación; las publicaciones de un moderador salen aprobadas.
        p.setStatus(user.getRole() == Role.MODERATOR ? PostStatus.APPROVED : PostStatus.PENDING);
        return mapper.toDto(posts.save(p), true);
    }

    /** Listado público: solo publicaciones APPROVED, con filtros opcionales. */
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
        // Las no aprobadas solo las ve su autor o un moderador (para el resto "no existe").
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
        if (p.getStatus() == PostStatus.FULFILLED || p.getStatus() == PostStatus.CANCELLED) {
            throw ApiException.conflict("Esta publicación ya no se puede editar");
        }
        apply(p, req);
        // Si un vecino edita, vuelve a moderación (evita cambiar el contenido después de aprobado).
        p.setStatus(user.getRole() == Role.MODERATOR ? PostStatus.APPROVED : PostStatus.PENDING);
        p.setModerationNote(null);
        return mapper.toDto(p, true);
    }

    @Transactional
    public PostDtos.PostResponse cancel(Long uid, Long id) {
        User user = currentUser.require(uid);
        Post p = find(id);
        if (!isOwner(p, uid) && user.getRole() != Role.MODERATOR) {
            throw ApiException.forbidden("No puedes cancelar esta publicación");
        }
        if (p.getStatus() == PostStatus.FULFILLED) {
            throw ApiException.conflict("Una publicación cumplida no se puede cancelar");
        }
        p.setStatus(PostStatus.CANCELLED);
        return mapper.toDto(p, true);
    }

    /**
     * El autor confirma que la ayuda se dio. Reciprocidad "ayni": quien ayuda suma puntos
     * y quien recibe suma "ayuda recibida". En un REQUEST ayuda quien responde; en un OFFER ayuda el autor.
     */
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

        User helper = p.getType() == PostType.REQUEST ? accepted.getHelper() : p.getAuthor();
        User receiver = p.getType() == PostType.REQUEST ? p.getAuthor() : accepted.getHelper();

        helper.setHelpGiven(helper.getHelpGiven() + 1);
        helper.setAyniPoints(helper.getAyniPoints() + POINTS_PER_HELP);
        receiver.setHelpReceived(receiver.getHelpReceived() + 1);
        p.setStatus(PostStatus.FULFILLED);
        return mapper.toDto(p, true);
    }

    // ---------- helpers ----------

    private void apply(Post p, PostDtos.PostRequest req) {
        p.setType(req.type());
        p.setCategory(req.category());
        p.setTitle(req.title().trim());
        p.setDescription(req.description().trim());
        p.setNeighborhood(req.neighborhood() == null || req.neighborhood().isBlank()
                ? null : req.neighborhood().trim());
        List<String> images = req.images() == null ? List.of() : req.images();
        for (String name : images) {
            if (!storage.exists(name)) {
                throw ApiException.badRequest("La imagen '" + name + "' no existe. Súbela primero en /api/uploads");
            }
        }
        p.setImages(new ArrayList<>(images));
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
