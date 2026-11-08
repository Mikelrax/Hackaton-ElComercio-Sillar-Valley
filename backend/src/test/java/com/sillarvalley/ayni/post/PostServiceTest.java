package com.sillarvalley.ayni.post;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.response.HelpResponse;
import com.sillarvalley.ayni.response.HelpResponseRepository;
import com.sillarvalley.ayni.response.HelpStatus;
import com.sillarvalley.ayni.storage.StorageService;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

class PostServiceTest {

    private PostRepository posts;
    private HelpResponseRepository responses;
    private CurrentUser currentUser;
    private StorageService storage;
    private PostService service;

    private User vecino;
    private User moderador;
    private User otro;

    private static User user(long id, Role role) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setFullName("Usuario " + id);
        u.setPhone("5190000000" + id);
        u.setRole(role);
        return u;
    }

    @BeforeEach
    void setUp() {
        posts = mock(PostRepository.class);
        responses = mock(HelpResponseRepository.class);
        currentUser = mock(CurrentUser.class);
        storage = mock(StorageService.class);
        service = new PostService(posts, responses, currentUser, storage, new PostMapper(storage));

        vecino = user(1, Role.NEIGHBOR);
        moderador = user(2, Role.MODERATOR);
        otro = user(3, Role.NEIGHBOR);
        when(currentUser.require(1L)).thenReturn(vecino);
        when(currentUser.require(2L)).thenReturn(moderador);
        when(currentUser.require(3L)).thenReturn(otro);
        when(posts.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private PostDtos.PostRequest request(List<String> images) {
        return new PostDtos.PostRequest(PostType.REQUEST, Category.HOGAR, " Necesito ayuda ",
                "Descripción", null, images);
    }

    private Post approvedPost(PostType type) {
        Post p = new Post();
        ReflectionTestUtils.setField(p, "id", 10L);
        p.setAuthor(vecino);
        p.setType(type);
        p.setCategory(Category.HOGAR);
        p.setTitle("t");
        p.setDescription("d");
        p.setStatus(PostStatus.APPROVED);
        return p;
    }

    @Test
    void publicacionDeVecinoQuedaPendiente() {
        var res = service.create(1L, request(null));
        assertEquals(PostStatus.PENDING, res.status());
        assertEquals("Necesito ayuda", res.title()); // se recorta el título
    }

    @Test
    void publicacionDeModeradorSaleAprobada() {
        var res = service.create(2L, request(List.of()));
        assertEquals(PostStatus.APPROVED, res.status());
    }

    @Test
    void imagenInexistenteEsBadRequest() {
        when(storage.exists("a".repeat(32) + ".jpg")).thenReturn(false);
        ApiException e = assertThrows(ApiException.class,
                () -> service.create(1L, request(List.of("a".repeat(32) + ".jpg"))));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void publicacionNoAprobadaEsInvisibleParaOtrosVecinos() {
        Post p = approvedPost(PostType.REQUEST);
        p.setStatus(PostStatus.PENDING);
        when(posts.findById(10L)).thenReturn(Optional.of(p));

        ApiException e = assertThrows(ApiException.class, () -> service.get(3L, 10L));
        assertEquals(HttpStatus.NOT_FOUND, e.getStatus());
        assertEquals(PostStatus.PENDING, service.get(1L, 10L).status());  // el autor sí
        assertEquals(PostStatus.PENDING, service.get(2L, 10L).status());  // el moderador sí
    }

    @Test
    void soloElAutorPuedeEditar() {
        when(posts.findById(10L)).thenReturn(Optional.of(approvedPost(PostType.REQUEST)));
        ApiException e = assertThrows(ApiException.class, () -> service.update(3L, 10L, request(null)));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void editarUnaPublicacionAprobadaLaVuelveAPendiente() {
        when(posts.findById(10L)).thenReturn(Optional.of(approvedPost(PostType.REQUEST)));
        assertEquals(PostStatus.PENDING, service.update(1L, 10L, request(null)).status());
    }

    @Test
    void cumplirUnPedidoDaPuntosAQuienResponde() {
        Post p = approvedPost(PostType.REQUEST); // autor = vecino (pide), responde "otro" (ayuda)
        HelpResponse r = new HelpResponse();
        r.setPost(p);
        r.setHelper(otro);
        r.setStatus(HelpStatus.ACCEPTED);
        when(posts.findById(10L)).thenReturn(Optional.of(p));
        when(responses.findFirstByPostIdAndStatus(10L, HelpStatus.ACCEPTED)).thenReturn(Optional.of(r));

        var res = service.fulfill(1L, 10L);

        assertEquals(PostStatus.FULFILLED, res.status());
        assertEquals(PostService.POINTS_PER_HELP, otro.getAyniPoints());
        assertEquals(1, otro.getHelpGiven());
        assertEquals(1, vecino.getHelpReceived());
        assertEquals(0, vecino.getAyniPoints());
    }

    @Test
    void cumplirUnaOfertaDaPuntosAlAutor() {
        Post p = approvedPost(PostType.OFFER); // autor = vecino (ofrece), responde "otro" (recibe)
        HelpResponse r = new HelpResponse();
        r.setPost(p);
        r.setHelper(otro);
        r.setStatus(HelpStatus.ACCEPTED);
        when(posts.findById(10L)).thenReturn(Optional.of(p));
        when(responses.findFirstByPostIdAndStatus(10L, HelpStatus.ACCEPTED)).thenReturn(Optional.of(r));

        service.fulfill(1L, 10L);

        assertEquals(PostService.POINTS_PER_HELP, vecino.getAyniPoints());
        assertEquals(1, otro.getHelpReceived());
    }

    @Test
    void noSePuedeCumplirSinRespuestaAceptada() {
        when(posts.findById(10L)).thenReturn(Optional.of(approvedPost(PostType.REQUEST)));
        when(responses.findFirstByPostIdAndStatus(10L, HelpStatus.ACCEPTED)).thenReturn(Optional.empty());

        ApiException e = assertThrows(ApiException.class, () -> service.fulfill(1L, 10L));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void soloElAutorPuedeMarcarCumplida() {
        when(posts.findById(10L)).thenReturn(Optional.of(approvedPost(PostType.REQUEST)));
        ApiException e = assertThrows(ApiException.class, () -> service.fulfill(3L, 10L));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }
}
