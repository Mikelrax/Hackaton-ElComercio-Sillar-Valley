package com.sillarvalley.ayni.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PhoneUtilsTest {

    @Test
    void normalizaNueveDigitosAgregandoCodigoDePais() {
        assertEquals("51987654321", PhoneUtils.normalize("987654321", "51"));
    }

    @Test
    void normalizaFormatoConMasYEspacios() {
        assertEquals("51987654321", PhoneUtils.normalize("+51 987-654-321", "51"));
    }

    @Test
    void validaTelefonos() {
        assertTrue(PhoneUtils.isValid("51987654321", "51"));
        assertFalse(PhoneUtils.isValid("5198765", "51"));
        assertFalse(PhoneUtils.isValid("34987654321", "51"));
        assertFalse(PhoneUtils.isValid(null, "51"));
    }
}
