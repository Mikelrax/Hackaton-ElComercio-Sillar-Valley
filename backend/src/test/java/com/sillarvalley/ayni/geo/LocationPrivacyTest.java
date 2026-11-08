package com.sillarvalley.ayni.geo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sillarvalley.ayni.TestProps;
import org.junit.jupiter.api.Test;

class LocationPrivacyTest {

    private final LocationPrivacy privacy = new LocationPrivacy(TestProps.create());

    private static double meters(double lat1, double lng1, double lat2, double lng2) {
        double dy = (lat2 - lat1) * 111_320;
        double dx = (lng2 - lng1) * 111_320 * Math.cos(Math.toRadians(lat1));
        return Math.hypot(dx, dy);
    }

    @Test
    void elPuntoAproximadoQuedaDentroDelCirculo() {
        for (long id = 1; id <= 200; id++) {
            var p = privacy.blur("post", id, -16.3884, -71.5418);
            double d = meters(-16.3884, -71.5418, p.latitude(), p.longitude());
            assertTrue(d >= 30 && d <= LocationPrivacy.RADIUS_METERS, "distancia " + d);
        }
    }

    @Test
    void elMismoRegistroSiempreCaeEnElMismoLugar() {
        assertEquals(privacy.blur("report", 9, -16.39, -71.54), privacy.blur("report", 9, -16.39, -71.54));
        assertNotEquals(privacy.blur("report", 9, -16.39, -71.54), privacy.blur("report", 10, -16.39, -71.54));
    }

    @Test
    void laDistanciaAproximadaSeRedondeaA100Metros() {
        assertEquals(100, LocationPrivacy.rough(12));
        assertEquals(400, LocationPrivacy.rough(372));
        assertNull(LocationPrivacy.rough(null));
    }
}
