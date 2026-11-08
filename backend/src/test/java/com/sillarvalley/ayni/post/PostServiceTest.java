package com.sillarvalley.ayni.post;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.TestProps;
import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.catalog.NeighborhoodRepository;
import com.sillarvalley.ayni.common.ApiException;
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
import java.time.Duration;
import java.time.Instant;
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
    private ReviewQueue reviews;
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
        reviews = mock(ReviewQueue.class);
        service = new PostService(posts, responses, currentUser, storage, new PostMapper(storage),
                new Locations(mock(NeighborhoodRepository.class), TestProps.create()), reviews);

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
                "Descripción", null, null, null, images);
    }

    private Address home(User owner, long id, String neighborhood) {
        Address a = new Address();
        ReflectionTestUtils.setField(a, "id", id);
        a.setLabel("Casa");
        a.setNeighborhood(neighborhood);
        a.setLatitude(-16.3884);
        a.setLongitude(-71.5418);
        owner.addAddress(a);
        return a;
    }

    @Test
    void publicacionUsaLaDireccionElegida() {
        home(vecino, 40, "Yanahuara");
        Address mama = home(vecino, 41, "Cayma");
        mama.setLatitude(-16.3716);

        var req = new PostDtos.PostRequest(PostType.REQUEST, Category.HOGAR, "Ayuda", "Descripción", 41L,
                null, null, null);
        var res = service.create(1L, req);

        assertEquals("Cayma", res.neighborhood());
    }

    @Test
    void sinDireccionElegidaUsaLaPrincipal() {
        home(vecino, 40, "Yanahuara");

        var res = service.create(1L, request(null));

        assertEquals("Yanahuara", res.neighborhood());
    }

    @Test
    void direccionAjenaEsBadRequest() {
        home(otro, 50, "Cayma");
        var req = new PostDtos.PostRequest(PostType.REQUEST, Category.HOGAR, "Ayuda", "Descripción", 50L,
                null, null, null);

        ApiException e = assertThrows(ApiException.class, () -> service.create(1L, req));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
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
        assertEquals("Necesito ayuda", res.title());
    }

    @Test
    void publicacionDeModeradorSaleAprobada() {
        var res = service.create(2L, request(List.of()));
        assertEquals(PostStatus.APPROVED, res.status());
        verify(reviews, never()).enqueue(any(), any());
    }

    @Test
    void publicacionPendienteEntraALaColaDeRevision() {
        when(posts.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 77L);
            return p;
        });
        when(reviews.enqueue(ReviewSubject.POST, 77L)).thenReturn(true);

        var res = service.create(1L, request(null));

        assertEquals(PostStatus.PENDING, res.status());
        assertEquals(AutoReview.QUEUED, res.autoReview().state());
        assertNull(res.autoReview().note());
    }

    @Test
    void sinRevisionAutomaticaQuedaParaElModerador() {
        var res = service.create(1L, request(null));

        verify(reviews).enqueue(eq(ReviewSubject.POST), any());
        assertNull(res.autoReview());
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
        assertEquals(PostStatus.PENDING, service.get(1L, 10L).status());
        assertEquals(PostStatus.PENDING, service.get(2L, 10L).status());
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

    private HelpResponse acceptedResponse(Post p, Instant acceptedAt) {
        HelpResponse r = new HelpResponse();
        r.setPost(p);
        r.setHelper(otro);
        r.setStatus(HelpStatus.ACCEPTED);
        r.setAcceptedAt(acceptedAt);
        when(posts.findById(10L)).thenReturn(Optional.of(p));
        when(responses.findFirstByPostIdAndStatus(10L, HelpStatus.ACCEPTED)).thenReturn(Optional.of(r));
        return r;
    }

    @Test
    void cumplirDejaLaPublicacionPorConfirmarYNoDaPuntos() {
        Post p = approvedPost(PostType.REQUEST);
        acceptedResponse(p, Instant.now().minus(Duration.ofHours(1)));

        var res = service.fulfill(1L, 10L);

        assertEquals(PostStatus.TO_CONFIRM, res.status());
        assertNotNull(p.getFulfilledAt());
        assertEquals(0, otro.getAyniPoints());
        assertEquals(0, otro.getHelpGiven());
        assertEquals(0, vecino.getHelpReceived());
    }

    @Test
    void noSePuedeCumplirAlPocoDeAceptar() {
        Post p = approvedPost(PostType.REQUEST);
        acceptedResponse(p, Instant.now().minus(Duration.ofMinutes(2)));

        ApiException e = assertThrows(ApiException.class, () -> service.fulfill(1L, 10L));

        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        assertEquals(PostStatus.APPROVED, p.getStatus());
    }

    @Test
    void respuestaAceptadaAntesDelCambioSePuedeCumplirDeInmediato() {
        Post p = approvedPost(PostType.REQUEST);
        acceptedResponse(p, null);

        assertEquals(PostStatus.TO_CONFIRM, service.fulfill(1L, 10L).status());
    }

    @Test
    void publicacionPorConfirmarNoSeEditaNiSeCancela() {
        Post p = approvedPost(PostType.REQUEST);
        p.setStatus(PostStatus.TO_CONFIRM);
        when(posts.findById(10L)).thenReturn(Optional.of(p));

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ApiException.class, () -> service.update(1L, 10L, request(null))).getStatus());
        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ApiException.class, () -> service.cancel(1L, 10L)).getStatus());
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
