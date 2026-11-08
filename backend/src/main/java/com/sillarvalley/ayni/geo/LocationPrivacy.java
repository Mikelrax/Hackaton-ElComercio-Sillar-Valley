package com.sillarvalley.ayni.geo;

import com.sillarvalley.ayni.AppProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class LocationPrivacy {

    public static final int RADIUS_METERS = 150;

    private static final double METERS_PER_DEGREE = 111_320.0;

    public record Point(double latitude, double longitude) {}

    private final SecretKeySpec key;

    public LocationPrivacy(AppProperties props) {
        this.key = new SecretKeySpec(("ayni-location:" + props.jwtSecret()).getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");
    }

    public Point blur(String kind, long id, double latitude, double longitude) {
        byte[] hash = hmac(kind + ":" + id);
        double angle = fraction(hash, 0) * 2 * Math.PI;
        double meters = 40 + fraction(hash, 2) * (RADIUS_METERS - 50);
        double dLat = meters * Math.cos(angle) / METERS_PER_DEGREE;
        double dLng = meters * Math.sin(angle) / (METERS_PER_DEGREE * Math.cos(Math.toRadians(latitude)));
        return new Point(round(latitude + dLat), round(longitude + dLng));
    }

    public static Integer rough(Integer meters) {
        return meters == null ? null : Math.max(100, Math.round(meters / 100f) * 100);
    }

    private byte[] hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(key);
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static double fraction(byte[] hash, int offset) {
        return (((hash[offset] & 0xFF) << 8) | (hash[offset + 1] & 0xFF)) / 65536.0;
    }

    private static double round(double value) {
        return Math.round(value * 100_000) / 100_000.0;
    }
}
