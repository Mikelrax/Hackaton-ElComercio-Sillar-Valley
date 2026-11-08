package com.sillarvalley.ayni.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

class TextSearchTest {

    @Test
    void quitaTildesYMayusculas() {
        assertEquals("gasfiteria menu nino", TextSearch.normalize("Gasfitería  MENÚ, niño!"));
    }

    @Test
    void separaPalabrasUtilesSinRepetir() {
        assertEquals(List.of("costura", "rapida"), TextSearch.tokens("Costura rápida costura a"));
    }

    @Test
    void textoVacioNoFiltra() {
        assertEquals(List.of(), TextSearch.tokens("   "));
        assertEquals("", TextSearch.normalize(null));
    }
}
