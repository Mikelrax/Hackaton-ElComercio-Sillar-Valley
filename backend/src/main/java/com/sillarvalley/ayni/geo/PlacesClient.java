package com.sillarvalley.ayni.geo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sillarvalley.ayni.AppProperties;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class PlacesClient {

    private static final Logger log = LoggerFactory.getLogger(PlacesClient.class);
    private static final double BOX_DEGREES = 0.3;
    private static final int CACHE_SIZE = 500;

    public record Hit(String name, String detail, double latitude, double longitude) {}

    public record Street(String name, String area) {}

    private static final Street NONE = new Street(null, null);

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Collection(List<Feature> features) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Feature(Geometry geometry, Properties properties) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Geometry(List<Double> coordinates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Properties(String name, String street, String housenumber, String district, String locality,
                      String city) {}

    private final RestClient client;
    private final AppProperties.City city;
    private final Map<String, Object> cache = Collections.synchronizedMap(new LinkedHashMap<>(64, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
            return size() > CACHE_SIZE;
        }
    });

    public PlacesClient(AppProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.client = RestClient.builder()
                .baseUrl(props.geo().placesUrl())
                .requestFactory(factory)
                .defaultHeader("User-Agent", "Ayni/1.0 (+https://aynibarrio.duckdns.org)")
                .build();
        this.city = props.city();
    }

    @SuppressWarnings("unchecked")
    public List<Hit> search(String query, double latitude, double longitude) {
        String text = query == null ? "" : query.trim();
        if (text.length() < 3) {
            return List.of();
        }
        String key = "s:" + text.toLowerCase(Locale.ROOT);
        Object cached = cache.get(key);
        if (cached != null) {
            return (List<Hit>) cached;
        }
        try {
            Collection result = client.get()
                    .uri(b -> b.path("/api/")
                            .queryParam("q", text)
                            .queryParam("limit", 6)
                            .queryParam("lat", latitude)
                            .queryParam("lon", longitude)
                            .queryParam("bbox", bbox())
                            .build())
                    .retrieve()
                    .body(Collection.class);
            List<Hit> hits = features(result).stream()
                    .map(PlacesClient::toHit)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            cache.put(key, hits);
            return hits;
        } catch (RestClientException e) {
            log.warn("No se pudo buscar lugares: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<Street> street(double latitude, double longitude) {
        String key = String.format(Locale.ROOT, "r:%.4f,%.4f", latitude, longitude);
        Object cached = cache.get(key);
        if (cached != null) {
            return Optional.of((Street) cached).filter(s -> s != NONE);
        }
        try {
            Collection result = client.get()
                    .uri(b -> b.path("/reverse")
                            .queryParam("lat", latitude)
                            .queryParam("lon", longitude)
                            .queryParam("limit", 1)
                            .queryParam("layer", "street")
                            .queryParam("radius", 0.3)
                            .build())
                    .retrieve()
                    .body(Collection.class);
            Street street = features(result).stream()
                    .findFirst()
                    .map(Feature::properties)
                    .filter(p -> p.name() != null && !p.name().isBlank())
                    .map(p -> new Street(p.name(), p.locality()))
                    .orElse(NONE);
            cache.put(key, street);
            return Optional.of(street).filter(s -> s != NONE);
        } catch (RestClientException e) {
            log.warn("No se pudo identificar la calle: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String bbox() {
        return String.format(Locale.ROOT, "%.4f,%.4f,%.4f,%.4f",
                city.longitude() - BOX_DEGREES, city.latitude() - BOX_DEGREES,
                city.longitude() + BOX_DEGREES, city.latitude() + BOX_DEGREES);
    }

    private static List<Feature> features(Collection result) {
        return result == null || result.features() == null ? List.of() : result.features();
    }

    private static Hit toHit(Feature f) {
        if (f.geometry() == null || f.geometry().coordinates() == null || f.geometry().coordinates().size() < 2
                || f.properties() == null) {
            return null;
        }
        Properties p = f.properties();
        String name = p.name() != null && !p.name().isBlank() ? p.name() : streetOf(p);
        if (name.isBlank()) {
            return null;
        }
        String detail = String.join(", ", Stream.of(name.equals(p.street()) ? null : p.street(), p.district(),
                        p.locality(), p.city())
                .filter(s -> s != null && !s.isBlank() && !s.equals(name))
                .distinct()
                .toList());
        return new Hit(name, detail, f.geometry().coordinates().get(1), f.geometry().coordinates().get(0));
    }

    private static String streetOf(Properties p) {
        if (p.street() == null || p.street().isBlank()) {
            return p.name() == null ? "" : p.name();
        }
        return p.housenumber() == null || p.housenumber().isBlank() ? p.street() : p.street() + " " + p.housenumber();
    }
}
