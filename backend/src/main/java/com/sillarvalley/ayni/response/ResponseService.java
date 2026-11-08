package com.sillarvalley.ayni.response;

import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserDtos;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResponseService {

    private final HelpResponseRepository responses;
    private final PostRepository posts;
    private final CurrentUser currentUser;

    public ResponseService(HelpResponseRepository responses, PostRepository posts, CurrentUser currentUser) {
        this.responses = responses;
        this.posts = posts;
        this.currentUser = currentUser;
    }

    @Transactional
    public ResponseDtos.HelpResponseDto create(Long uid, Long postId, ResponseDtos.ResponseRequest req) {
        User user = currentUser.require(uid);
        Post post = posts.findById(postId).orElseThrow(() -> ApiException.notFound("Publicación no encontrada"));
        if (post.getStatus() != PostStatus.APPROVED) {
            throw ApiException.conflict("Esta publicación no admite respuestas");
        }
        if (post.getAuthor().getId().equals(uid)) {
            throw ApiException.badRequest("No puedes responder a tu propia publicación");
        }
        if (responses.existsByPostIdAndHelperId(postId, uid)) {
            throw ApiException.conflict("Ya respondiste a esta publicación");
        }
        HelpResponse r = new HelpResponse();
        r.setPost(post);
        r.setHelper(user);
        r.setMessage(req.message().trim());
        return toDto(responses.save(r), post.getAuthor().getPhone(), false);
    }

    @Transactional(readOnly = true)
    public List<ResponseDtos.HelpResponseDto> listForPost(Long uid, Long postId) {
        User user = currentUser.require(uid);
        Post post = posts.findById(postId).orElseThrow(() -> ApiException.notFound("Publicación no encontrada"));
        if (!post.getAuthor().getId().equals(uid) && user.getRole() != Role.MODERATOR) {
            throw ApiException.forbidden("Solo el autor puede ver las respuestas");
        }
        return responses.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(r -> toDto(r, null, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<ResponseDtos.HelpResponseDto> mine(Long uid) {
        currentUser.require(uid);
        return responses.findByHelperIdOrderByCreatedAtDesc(uid).stream()
                .map(r -> toDto(r, r.getPost().getAuthor().getPhone(), false)).toList();
    }

    @Transactional
    public ResponseDtos.HelpResponseDto accept(Long uid, Long responseId) {
        currentUser.require(uid);
        HelpResponse r = findOwnedByPostAuthor(uid, responseId);
        if (r.getStatus() != HelpStatus.PENDING) {
            throw ApiException.conflict("Solo se puede aceptar una respuesta pendiente");
        }
        if (r.getPost().getStatus() != PostStatus.APPROVED) {
            throw ApiException.conflict("La publicación ya no está activa");
        }
        if (responses.existsByPostIdAndStatus(r.getPost().getId(), HelpStatus.ACCEPTED)) {
            throw ApiException.conflict("Ya aceptaste a otra persona en esta publicación");
        }
        r.setStatus(HelpStatus.ACCEPTED);
        return toDto(r, null, true);
    }

    @Transactional
    public ResponseDtos.HelpResponseDto decline(Long uid, Long responseId) {
        currentUser.require(uid);
        HelpResponse r = findOwnedByPostAuthor(uid, responseId);
        if (r.getStatus() != HelpStatus.PENDING) {
            throw ApiException.conflict("Solo se puede rechazar una respuesta pendiente");
        }
        r.setStatus(HelpStatus.DECLINED);
        return toDto(r, null, true);
    }

    @Transactional
    public ResponseDtos.HelpResponseDto withdraw(Long uid, Long responseId) {
        currentUser.require(uid);
        HelpResponse r = responses.findById(responseId)
                .orElseThrow(() -> ApiException.notFound("Respuesta no encontrada"));
        if (!r.getHelper().getId().equals(uid)) {
            throw ApiException.forbidden("Solo quien respondió puede retirarla");
        }
        if (r.getStatus() != HelpStatus.PENDING) {
            throw ApiException.conflict("Solo se puede retirar una respuesta pendiente");
        }
        r.setStatus(HelpStatus.WITHDRAWN);
        return toDto(r, null, false);
    }

    private HelpResponse findOwnedByPostAuthor(Long uid, Long responseId) {
        HelpResponse r = responses.findById(responseId)
                .orElseThrow(() -> ApiException.notFound("Respuesta no encontrada"));
        if (!r.getPost().getAuthor().getId().equals(uid)) {
            throw ApiException.forbidden("Solo el autor de la publicación puede gestionar sus respuestas");
        }
        return r;
    }

    private ResponseDtos.HelpResponseDto toDto(HelpResponse r, String otherPartyPhone, boolean showHelperPhone) {
        String phone = null;
        if (r.getStatus() == HelpStatus.ACCEPTED) {
            phone = showHelperPhone ? r.getHelper().getPhone() : otherPartyPhone;
        }
        return new ResponseDtos.HelpResponseDto(r.getId(), r.getPost().getId(), r.getPost().getTitle(),
                UserDtos.UserSummary.of(r.getHelper()), r.getMessage(), r.getStatus(), r.getStatus().label(), phone,
                r.getCreatedAt());
    }
}
