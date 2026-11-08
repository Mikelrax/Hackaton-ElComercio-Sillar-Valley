package com.sillarvalley.ayni.award;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class AwardServiceTest {

    private HelpAwardRepository awards;
    private PostRepository posts;
    private AwardService service;

    private User helper;
    private User receiver;
    private Post post;

    private static User user(long id) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setFullName("Usuario " + id);
        u.setPhone("5190000000" + id);
        u.setRole(Role.NEIGHBOR);
        return u;
    }

    private static HelpAward award(User helper, User receiver, int points, AwardLimit reason, Instant at) {
        HelpAward a = new HelpAward();
        a.setHelper(helper);
        a.setReceiver(receiver);
        a.setPoints(points);
        a.setReason(reason);
        a.setCreatedAt(at);
        return a;
    }

    @BeforeEach
    void setUp() {
        awards = mock(HelpAwardRepository.class);
        posts = mock(PostRepository.class);
        service = new AwardService(awards, posts);
        helper = user(1);
        receiver = user(2);
        post = new Post();
        ReflectionTestUtils.setField(post, "id", 10L);
    }

    @Test
    void ayudaConfirmadaSumaPuntosYContadores() {
        var result = service.award(post, helper, receiver);

        assertEquals(AwardService.POINTS_PER_HELP, result.points());
        assertNull(result.limit());
        assertEquals(AwardService.POINTS_PER_HELP, helper.getAyniPoints());
        assertEquals(1, helper.getHelpGiven());
        assertEquals(1, receiver.getHelpReceived());
        assertEquals(0, receiver.getAyniPoints());
    }

    @Test
    void ayudaConfirmadaQuedaRegistradaConSusPuntos() {
        service.award(post, helper, receiver);

        ArgumentCaptor<HelpAward> saved = ArgumentCaptor.forClass(HelpAward.class);
        verify(awards).save(saved.capture());
        assertEquals(AwardService.POINTS_PER_HELP, saved.getValue().getPoints());
        assertEquals(helper, saved.getValue().getHelper());
        assertEquals(receiver, saved.getValue().getReceiver());
    }

    @Test
    void alLlegarAlTopeDiarioNoSumaPuntosPeroCuentaLaAyuda() {
        when(awards.countByHelperIdAndPointsGreaterThanAndCreatedAtAfter(anyLong(), anyInt(), any()))
                .thenReturn((long) AwardService.DAILY_POINTED_HELPS);

        var result = service.award(post, helper, receiver);

        assertEquals(0, result.points());
        assertEquals(AwardLimit.DAILY_LIMIT, result.limit());
        assertEquals(0, helper.getAyniPoints());
        assertEquals(1, helper.getHelpGiven());
        assertEquals(1, receiver.getHelpReceived());
    }

    @Test
    void mismaParejaDentroDelMesNoSumaPuntos() {
        when(awards.countPointsBetween(anyLong(), anyLong(), any()))
                .thenReturn((long) AwardService.POINTED_HELPS_PER_PAIR);

        var result = service.award(post, helper, receiver);

        assertEquals(0, result.points());
        assertEquals(AwardLimit.PAIR_LIMIT, result.limit());
        assertEquals(0, helper.getAyniPoints());
    }

    @Test
    void unaAyudaSinPuntosQuedaRegistradaConSuMotivo() {
        when(awards.countPointsBetween(anyLong(), anyLong(), any())).thenReturn(1L);

        service.award(post, helper, receiver);

        ArgumentCaptor<HelpAward> saved = ArgumentCaptor.forClass(HelpAward.class);
        verify(awards).save(saved.capture());
        assertEquals(0, saved.getValue().getPoints());
        assertEquals(AwardLimit.PAIR_LIMIT, saved.getValue().getReason());
    }

    @Test
    void publicacionesSinConfirmarEnSieteDiasSeCierranSinPuntos() {
        Post stale = new Post();
        stale.setStatus(PostStatus.TO_CONFIRM);
        when(posts.findByStatusAndFulfilledAtBefore(any(), any())).thenReturn(List.of(stale));

        assertEquals(1, service.expireUnconfirmed());
        assertEquals(PostStatus.FULFILLED, stale.getStatus());
        assertEquals(0, helper.getAyniPoints());
    }

    @Test
    void parQueSeAyudaVariasVecesGeneraAlerta() {
        Instant now = Instant.now();
        List<HelpAward> history = new ArrayList<>();
        history.add(award(helper, receiver, 10, null, now.minus(Duration.ofDays(20))));
        history.add(award(receiver, helper, 0, AwardLimit.PAIR_LIMIT, now.minus(Duration.ofDays(10))));
        history.add(award(helper, receiver, 0, AwardLimit.PAIR_LIMIT, now.minus(Duration.ofDays(1))));
        when(awards.findSince(any())).thenReturn(history);

        var alerts = service.alerts();

        assertEquals(1, alerts.size());
        assertEquals("RING", alerts.get(0).kind());
        assertEquals(3, alerts.get(0).count());
        assertEquals(2, alerts.get(0).users().size());
    }

    @Test
    void dosAyudasEntreElMismoParNoGeneranAlerta() {
        Instant now = Instant.now();
        when(awards.findSince(any())).thenReturn(List.of(
                award(helper, receiver, 10, null, now.minus(Duration.ofDays(20))),
                award(receiver, helper, 10, null, now.minus(Duration.ofDays(1)))));

        assertTrue(service.alerts().isEmpty());
    }

    @Test
    void usuarioQueTocaElTopeVariosDiasGeneraAlerta() {
        Instant now = Instant.now();
        when(awards.findSince(any())).thenReturn(List.of(
                award(helper, receiver, 0, AwardLimit.DAILY_LIMIT, now.minus(Duration.ofHours(30))),
                award(helper, user(3), 0, AwardLimit.DAILY_LIMIT, now.minus(Duration.ofHours(2)))));

        var alerts = service.alerts();

        assertEquals(1, alerts.size());
        assertEquals("CAPPED", alerts.get(0).kind());
        assertEquals(2, alerts.get(0).count());
    }

    @Test
    void tocarElTopeUnSoloDiaNoGeneraAlerta() {
        Instant now = Instant.now();
        when(awards.findSince(any())).thenReturn(List.of(
                award(helper, receiver, 0, AwardLimit.DAILY_LIMIT, now.minus(Duration.ofMinutes(5))),
                award(helper, user(3), 0, AwardLimit.DAILY_LIMIT, now.minus(Duration.ofMinutes(4)))));

        assertTrue(service.alerts().isEmpty());
    }
}
