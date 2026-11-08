package com.sillarvalley.ayni.review;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ReviewRulesTest {

    private static ReviewContent post(String text, int images) {
        return new ReviewContent(ReviewSubject.POST, "", text, images);
    }

    private static final ReviewResult OK = new ReviewResult(ReviewDecision.APROBAR, "Pedido claro.");

    @Test
    void textoNormalRespetaLaDecision() {
        ReviewResult r = ReviewRules.apply(post("Necesito una escalera prestada el sábado", 0), OK);
        assertEquals(ReviewDecision.APROBAR, r.decision());
        assertEquals("Pedido claro.", r.reason());
    }

    @Test
    void enlaceLoPasaAlModerador() {
        ReviewResult r = ReviewRules.apply(post("Gana premios en bit.ly/premio", 0), OK);
        assertEquals(ReviewDecision.REVISAR, r.decision());
        assertTrue(r.reason().startsWith("Tiene un enlace."));
    }

    @Test
    void puntoSinEspacioNoEsEnlace() {
        ReviewResult r = ReviewRules.apply(post("Necesito ayuda.Me pueden prestar un taladro", 0), OK);
        assertEquals(ReviewDecision.APROBAR, r.decision());
    }

    @Test
    void telefonoEnElTextoLoPasaAlModerador() {
        ReviewResult r = ReviewRules.apply(post("Llamen al 987 654 321", 0), OK);
        assertEquals(ReviewDecision.REVISAR, r.decision());
    }

    @Test
    void fotosLasVeUnaPersona() {
        ReviewResult r = ReviewRules.apply(post("Ofrezco ropa de niño", 2), OK);
        assertEquals(ReviewDecision.REVISAR, r.decision());
    }

    @Test
    void reglasNoBajanUnaSospecha() {
        ReviewResult sospechosa = new ReviewResult(ReviewDecision.SOSPECHOSA, "Pide un depósito.");
        ReviewResult r = ReviewRules.apply(post("Deposita en www.ejemplo.com", 0), sospechosa);
        assertEquals(ReviewDecision.SOSPECHOSA, r.decision());
    }

    @Test
    void notaLargaSeRecorta() {
        String note = ReviewRules.note("a".repeat(400));
        assertEquals(ReviewRules.NOTE_MAX, note.length());
        assertTrue(note.endsWith("…"));
    }
}
