package com.sillarvalley.ayni.response;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.award.AwardLimit;
import com.sillarvalley.ayni.award.AwardService;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.post.PostType;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

class ResponseServiceTest {

    private HelpResponseRepository responses;
    private AwardService awards;
    private ResponseService service;

    private User autor;
    private User vecino;
    private User tercero;

    private static User user(long id) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setFullName("Usuario " + id);
        u.setPhone("5190000000" + id);
        u.setRole(Role.NEIGHBOR);
        return u;
    }

    @BeforeEach
    void setUp() {
        responses = mock(HelpResponseRepository.class);
        awards = mock(AwardService.class);
        CurrentUser currentUser = mock(CurrentUser.class);
        service = new ResponseService(responses, mock(PostRepository.class), currentUser, awards);
        autor = user(1);
        vecino = user(2);
        tercero = user(3);
        when(currentUser.require(1L)).thenReturn(autor);
        when(currentUser.require(2L)).thenReturn(vecino);
        when(currentUser.require(3L)).thenReturn(tercero);
    }

    private HelpResponse accepted(PostType type, PostStatus postStatus) {
        Post p = new Post();
        ReflectionTestUtils.setField(p, "id", 10L);
        p.setAuthor(autor);
        p.setType(type);
        p.setCategory(Category.HOGAR);
        p.setTitle("t");
        p.setDescription("d");
        p.setStatus(postStatus);
        HelpResponse r = new HelpResponse();
        ReflectionTestUtils.setField(r, "id", 20L);
        r.setPost(p);
        r.setHelper(vecino);
        r.setMessage("m");
        r.setStatus(HelpStatus.ACCEPTED);
        when(responses.findById(20L)).thenReturn(Optional.of(r));
        return r;
    }

    @Test
    void aceptarGuardaElMomentoDeLaAceptacion() {
        HelpResponse r = accepted(PostType.REQUEST, PostStatus.APPROVED);
        r.setStatus(HelpStatus.PENDING);

        service.accept(1L, 20L);

        assertEquals(HelpStatus.ACCEPTED, r.getStatus());
        assertEquals(true, r.getAcceptedAt() != null);
    }

    @Test
    void confirmarUnPedidoPremiaAQuienRespondio() {
        HelpResponse r = accepted(PostType.REQUEST, PostStatus.TO_CONFIRM);
        when(awards.award(r.getPost(), vecino, autor)).thenReturn(new AwardService.Result(10, null));

        var res = service.confirm(2L, 20L);

        assertEquals(PostStatus.FULFILLED, r.getPost().getStatus());
        assertEquals(10, res.points());
        verify(awards).award(r.getPost(), vecino, autor);
    }

    @Test
    void confirmarUnaOfertaPremiaAlAutor() {
        HelpResponse r = accepted(PostType.OFFER, PostStatus.TO_CONFIRM);
        when(awards.award(r.getPost(), autor, vecino)).thenReturn(new AwardService.Result(10, null));

        var res = service.confirm(2L, 20L);

        assertEquals(PostStatus.FULFILLED, r.getPost().getStatus());
        assertEquals(0, res.points());
        verify(awards).award(r.getPost(), autor, vecino);
    }

    @Test
    void confirmarSinPuntosPorLimiteExplicaElMotivo() {
        HelpResponse r = accepted(PostType.REQUEST, PostStatus.TO_CONFIRM);
        when(awards.award(r.getPost(), vecino, autor)).thenReturn(new AwardService.Result(0, AwardLimit.PAIR_LIMIT));

        var res = service.confirm(2L, 20L);

        assertEquals(0, res.points());
        assertEquals(AwardLimit.PAIR_LIMIT.message(), res.message());
    }

    @Test
    void soloQuienRespondioPuedeConfirmar() {
        accepted(PostType.REQUEST, PostStatus.TO_CONFIRM);

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.confirm(1L, 20L)).getStatus());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.confirm(3L, 20L)).getStatus());
        verify(awards, never()).award(any(), any(), any());
    }

    @Test
    void noSeConfirmaHastaQueElAutorMarqueCumplida() {
        accepted(PostType.REQUEST, PostStatus.APPROVED);

        ApiException e = assertThrows(ApiException.class, () -> service.confirm(2L, 20L));

        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        verify(awards, never()).award(any(), any(), any());
    }

    @Test
    void noSePuedeConfirmarDosVeces() {
        HelpResponse r = accepted(PostType.REQUEST, PostStatus.FULFILLED);

        ApiException e = assertThrows(ApiException.class, () -> service.confirm(2L, 20L));

        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        assertEquals(PostStatus.FULFILLED, r.getPost().getStatus());
        verify(awards, never()).award(any(), any(), any());
    }

    @Test
    void soloSeConfirmaUnaRespuestaAceptada() {
        HelpResponse r = accepted(PostType.REQUEST, PostStatus.TO_CONFIRM);
        r.setStatus(HelpStatus.PENDING);

        ApiException e = assertThrows(ApiException.class, () -> service.confirm(2L, 20L));

        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }
}
