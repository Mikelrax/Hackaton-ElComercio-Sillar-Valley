package com.sillarvalley.ayni.business;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class OpeningHoursTest {

    private static final LocalTime NINE = LocalTime.of(9, 0);
    private static final LocalTime SIX_PM = LocalTime.of(18, 0);
    private static final LocalDateTime MONDAY_NOON = LocalDateTime.of(2026, 11, 9, 12, 0);
    private static final LocalDateTime SUNDAY_NOON = LocalDateTime.of(2026, 11, 8, 12, 0);

    @Test
    void abiertoDentroDelHorarioYDia() {
        assertTrue(OpeningHours.isOpen(NINE, SIX_PM, "123456", MONDAY_NOON));
        assertEquals("Abierto hasta las 6 p. m.", OpeningHours.describe(NINE, SIX_PM, "123456", MONDAY_NOON));
    }

    @Test
    void cerradoElDiaQueNoAtiende() {
        assertFalse(OpeningHours.isOpen(NINE, SIX_PM, "123456", SUNDAY_NOON));
        assertEquals("Cerrado ahora", OpeningHours.describe(NINE, SIX_PM, "123456", SUNDAY_NOON));
    }

    @Test
    void avisaCuandoAbreMasTarde() {
        LocalDateTime early = LocalDateTime.of(2026, 11, 9, 7, 30);
        assertEquals("Cerrado · abre a las 9 a. m.", OpeningHours.describe(NINE, SIX_PM, null, early));
    }

    @Test
    void horarioQuePasaLaMedianoche() {
        LocalTime eightPm = LocalTime.of(20, 0);
        LocalTime twoAm = LocalTime.of(2, 0);
        assertTrue(OpeningHours.isOpen(eightPm, twoAm, null, LocalDateTime.of(2026, 11, 9, 23, 30)));
        assertTrue(OpeningHours.isOpen(eightPm, twoAm, null, LocalDateTime.of(2026, 11, 9, 1, 0)));
        assertFalse(OpeningHours.isOpen(eightPm, twoAm, null, MONDAY_NOON));
    }

    @Test
    void sinHorarioNoSeSabe() {
        assertNull(OpeningHours.isOpen(null, null, null, MONDAY_NOON));
        assertEquals("Horario no indicado", OpeningHours.describe(null, null, null, MONDAY_NOON));
    }

    @Test
    void formatoDeHora() {
        assertEquals("12:30 p. m.", OpeningHours.format(LocalTime.of(12, 30)));
        assertEquals("12 a. m.", OpeningHours.format(LocalTime.MIDNIGHT));
    }
}
