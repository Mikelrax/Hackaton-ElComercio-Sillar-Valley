package com.sillarvalley.ayni.assistant;

import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.ToolResultBlockParam;
import com.anthropic.models.messages.ToolUseBlock;
import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.business.BusinessDtos;
import com.sillarvalley.ayni.business.BusinessService;
import com.sillarvalley.ayni.catalog.CatalogController;
import com.sillarvalley.ayni.emergency.EmergencyDtos;
import com.sillarvalley.ayni.emergency.EmergencyService;
import com.sillarvalley.ayni.emergency.EmergencyStatus;
import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.PostDtos;
import com.sillarvalley.ayni.post.PostService;
import com.sillarvalley.ayni.post.PostType;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public class AssistantTools {

    static final String SEARCH_BUSINESSES = "buscar_negocios";
    static final String SEARCH_WALL = "ver_muro";
    static final String EMERGENCY = "ver_emergencia";
    static final String EMERGENCY_NUMBERS = "mostrar_numeros_emergencia";
    static final String DRAFT = "preparar_publicacion";

    private static final Logger log = LoggerFactory.getLogger(AssistantTools.class);
    private static final int NEAR_RADIUS = 3000;
    private static final int MAX_CARDS = 4;
    private static final Map<String, Integer> DRAFT_LIMITS = Map.of(
            "necesito", 300, "ofrezco", 300, "recomiendo", 120, "emergencia", 100);

    private final BusinessService businesses;
    private final PostService posts;
    private final EmergencyService emergency;
    private final JsonMapper json;
    private final DateTimeFormatter dateFormat;

    public AssistantTools(BusinessService businesses, PostService posts, EmergencyService emergency,
                          JsonMapper json, AppProperties props) {
        this.businesses = businesses;
        this.posts = posts;
        this.emergency = emergency;
        this.json = json;
        this.dateFormat = DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale.of("es", "PE"))
                .withZone(ZoneId.of(props.timezone()));
    }

    Session session(Long uid, double latitude, double longitude) {
        return new Session(uid, latitude, longitude, businessCategories());
    }

    private Map<String, String> businessCategories() {
        Map<String, String> map = new LinkedHashMap<>();
        businesses.categories().forEach(c -> map.put(c.slug(), c.name()));
        return map;
    }

    final class Session {

        private final Long uid;
        private final double latitude;
        private final double longitude;
        private final Map<String, String> categories;
        private List<BusinessDtos.BusinessSummary> foundBusinesses = List.of();
        private List<AssistantDtos.PostCard> foundPosts = List.of();
        private List<EmergencyDtos.SupportPointResponse> foundPoints = List.of();
        private AssistantDtos.PublishDraft draft;
        private boolean showEmergencyNumbers;

        private Session(Long uid, double latitude, double longitude, Map<String, String> categories) {
            this.uid = uid;
            this.latitude = latitude;
            this.longitude = longitude;
            this.categories = categories;
        }

        List<Tool> definitions() {
            Map<String, Object> search = new LinkedHashMap<>();
            search.put("palabras", Map.of("type", "string", "description",
                    "Una o dos palabras clave de lo que busca, por ejemplo \"gasfitero\", \"menú\" o \"costura\". "
                            + "Déjalo vacío si ya elegiste una categoría que lo describe."));
            search.put("categoria", Map.of("type", "string", "enum", List.copyOf(categories.keySet()),
                    "description", "Categoría del directorio: " + describe(categories)));
            search.put("abierto_ahora", Map.of("type", "boolean",
                    "description", "true solo si pide algo abierto en este momento."));

            Map<String, Object> wall = new LinkedHashMap<>();
            wall.put("tipo", Map.of("type", "string", "enum", List.of("necesito", "ofrezco"),
                    "description", "necesito: vecinos que piden ayuda. ofrezco: vecinos que ofrecen algo."));
            wall.put("categoria", Map.of("type", "string",
                    "enum", Arrays.stream(Category.values()).map(Enum::name).toList(),
                    "description", "Tema del favor: " + describe(postCategories())));
            wall.put("palabras", Map.of("type", "string",
                    "description", "Una o dos palabras clave, por ejemplo \"escalera\" o \"taladro\"."));

            Map<String, Object> publish = new LinkedHashMap<>();
            publish.put("tipo", Map.of("type", "string", "enum", List.of("necesito", "ofrezco", "recomiendo", "emergencia"),
                    "description", "necesito: pedir un favor. ofrezco: ofrecer algo. recomiendo: recomendar un negocio. "
                            + "emergencia: avisar una emergencia a los vecinos."));
            publish.put("texto", Map.of("type", "string",
                    "description", "Texto corto en primera persona, como lo escribiría el vecino. "
                            + "Para recomiendo, solo el nombre del negocio."));

            return List.of(
                    tool(SEARCH_BUSINESSES, "Busca negocios y servicios del barrio recomendados por vecinos, "
                            + "ordenados por recomendaciones y cerca de la casa del vecino.", search, List.of()),
                    tool(SEARCH_WALL, "Busca en el muro solidario los favores que piden u ofrecen los vecinos "
                            + "sin dinero de por medio.", wall, List.of()),
                    tool(EMERGENCY, "Consulta si el modo emergencia está activo, cuántos pedidos de ayuda faltan "
                            + "atender y los puntos de apoyo más cercanos.", Map.of(), List.of()),
                    tool(EMERGENCY_NUMBERS, "Muestra en pantalla botones grandes para llamar a Policía, Bomberos "
                            + "y SAMU. Úsala ante cualquier peligro para la vida o la salud.", Map.of(), List.of()),
                    tool(DRAFT, "Prepara un borrador de publicación. La app muestra un botón para que el vecino lo "
                            + "revise, elija la categoría y lo publique. Tú nunca publicas.", publish,
                            List.of("tipo", "texto")));
        }

        ToolResultBlockParam run(ToolUseBlock call) {
            ToolResultBlockParam.Builder result = ToolResultBlockParam.builder().toolUseId(call.id());
            try {
                Map<?, ?> input = call._input().convert(Map.class);
                Object output = switch (call.name()) {
                    case SEARCH_BUSINESSES -> searchBusinesses(input == null ? Map.of() : input);
                    case SEARCH_WALL -> searchWall(input == null ? Map.of() : input);
                    case EMERGENCY -> emergencyStatus();
                    case EMERGENCY_NUMBERS -> emergencyNumbers();
                    case DRAFT -> prepareDraft(input == null ? Map.of() : input);
                    default -> null;
                };
                if (output == null) {
                    return result.content("Herramienta desconocida: " + call.name()).isError(true).build();
                }
                return result.content(json.writeValueAsString(output)).build();
            } catch (RuntimeException e) {
                log.warn("Kusi no pudo usar {}: {}", call.name(), e.getMessage());
                return result.content("No se pudo consultar en este momento.").isError(true).build();
            }
        }

        AssistantDtos.ChatResponse reply(String text) {
            return new AssistantDtos.ChatResponse(text, foundBusinesses, foundPosts, foundPoints, draft,
                    showEmergencyNumbers);
        }

        private Map<String, Object> searchBusinesses(Map<?, ?> input) {
            String words = text(input, "palabras");
            String category = text(input, "categoria");
            if (category != null && !categories.containsKey(category)) {
                category = null;
            }
            boolean openNow = Boolean.TRUE.equals(input.get("abierto_ahora"));

            List<Attempt> attempts = new ArrayList<>();
            attempts.add(new Attempt(words, category, NEAR_RADIUS));
            attempts.add(new Attempt(words, category, null));
            if (words != null && category != null) {
                attempts.add(new Attempt(null, category, null));
            }

            BusinessDtos.SearchResponse found = null;
            Integer radius = null;
            for (Attempt attempt : attempts) {
                radius = attempt.radius();
                found = businesses.search(uid, attempt.words(), attempt.category(), latitude, longitude,
                        radius, openNow, "recommended", 0, MAX_CARDS);
                if (found.totalElements() > 0) {
                    break;
                }
            }
            foundBusinesses = found == null ? List.of() : found.content();

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("alcance", radius == null ? "toda la ciudad" : "a menos de 3 km de su casa");
            out.put("total", found == null ? 0 : found.totalElements());
            out.put("negocios", foundBusinesses.stream().map(b -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("nombre", b.name());
                m.put("categoria", b.categoryName());
                m.put("barrio", b.neighborhood());
                m.put("distancia", distance(b.distanceMeters()));
                m.put("abierto_ahora", b.openNow());
                m.put("horario", b.scheduleText());
                m.put("recomendaciones", b.recommendationsCount());
                m.put("buen_precio", b.tags().goodPrice());
                m.put("puntual", b.tags().punctual());
                m.put("confiable", b.tags().reliable());
                return m;
            }).toList());
            return out;
        }

        private Map<String, Object> searchWall(Map<?, ?> input) {
            String type = text(input, "tipo");
            PostType postType = "necesito".equals(type) ? PostType.REQUEST
                    : "ofrezco".equals(type) ? PostType.OFFER : null;
            Category category = Arrays.stream(Category.values())
                    .filter(c -> c.name().equals(text(input, "categoria"))).findFirst().orElse(null);
            String words = text(input, "palabras");

            var page = posts.search(uid, postType, category, words, 0, MAX_CARDS);
            if (page.totalElements() == 0 && words != null) {
                page = posts.search(uid, postType, category, null, 0, MAX_CARDS);
            }
            foundPosts = page.content().stream().map(AssistantTools::card).toList();

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("total", page.totalElements());
            out.put("publicaciones", foundPosts.stream().map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("tipo", p.typeLabel());
                m.put("categoria", p.categoryLabel());
                m.put("texto", p.title());
                m.put("barrio", p.neighborhood());
                m.put("fecha", p.createdAt() == null ? null : dateFormat.format(p.createdAt()));
                return m;
            }).toList());
            return out;
        }

        private Map<String, Object> emergencyStatus() {
            EmergencyDtos.Overview overview = emergency.overview(uid, latitude, longitude);
            foundPoints = overview.supportPoints().stream().filter(EmergencyDtos.SupportPointResponse::open)
                    .limit(MAX_CARDS).toList();

            Map<String, Object> mode = new LinkedHashMap<>();
            mode.put("activo", overview.mode().active());
            mode.put("titulo", overview.mode().title());
            mode.put("mensaje", overview.mode().message());

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("modo_emergencia", mode);
            out.put("pedidos_de_ayuda_sin_atender", overview.reports().stream()
                    .filter(r -> r.status() == EmergencyStatus.URGENT).count());
            out.put("puntos_de_apoyo_abiertos", foundPoints.stream().map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("nombre", p.name());
                m.put("tipo", p.typeLabel());
                m.put("barrio", p.neighborhood());
                m.put("direccion", p.address());
                m.put("distancia", distance(p.distanceMeters()));
                return m;
            }).toList());
            return out;
        }

        private Map<String, Object> emergencyNumbers() {
            showEmergencyNumbers = true;
            return Map.of(
                    "numeros", CatalogController.EMERGENCY_NUMBERS.stream()
                            .map(n -> n.label() + " " + n.value()).toList(),
                    "nota", "La app ya muestra botones grandes para llamar.");
        }

        private Map<String, Object> prepareDraft(Map<?, ?> input) {
            String type = text(input, "tipo");
            String body = text(input, "texto");
            if (type == null || body == null || !DRAFT_LIMITS.containsKey(type)) {
                return Map.of("error", "Falta el tipo o el texto del borrador.");
            }
            int limit = DRAFT_LIMITS.get(type);
            draft = new AssistantDtos.PublishDraft(type, body.length() > limit ? body.substring(0, limit).trim() : body);
            return Map.of("listo", true,
                    "nota", "Debajo de tu mensaje aparece el botón «Revisar y publicar». "
                            + "El vecino lo toca, elige la categoría y publica.");
        }
    }

    private static AssistantDtos.PostCard card(PostDtos.PostResponse p) {
        return new AssistantDtos.PostCard(p.id(), p.type().name(), p.type().label(), p.category().name(),
                p.categoryLabel(), p.title(), p.neighborhood(), p.createdAt());
    }

    private static Map<String, String> postCategories() {
        Map<String, String> map = new LinkedHashMap<>();
        Arrays.stream(Category.values()).forEach(c -> map.put(c.name(), c.label()));
        return map;
    }

    private static String describe(Map<String, String> options) {
        return String.join(", ", options.entrySet().stream().map(e -> e.getKey() + " (" + e.getValue() + ")").toList());
    }

    private static Tool tool(String name, String description, Map<String, Object> properties, List<String> required) {
        Tool.InputSchema.Properties.Builder props = Tool.InputSchema.Properties.builder();
        properties.forEach((key, schema) -> props.putAdditionalProperty(key, JsonValue.from(schema)));
        Tool.InputSchema.Builder schema = Tool.InputSchema.builder().properties(props.build());
        if (!required.isEmpty()) {
            schema.required(required);
        }
        return Tool.builder().name(name).description(description).inputSchema(schema.build()).build();
    }

    private static String text(Map<?, ?> input, String key) {
        Object value = input.get(key);
        if (!(value instanceof String s)) {
            return null;
        }
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String distance(Integer meters) {
        if (meters == null) {
            return null;
        }
        if (meters < 1000) {
            return Math.max(10, Math.round(meters / 10.0) * 10) + " m";
        }
        return String.format(Locale.of("es", "PE"), "%.1f km", meters / 1000.0);
    }

    private record Attempt(String words, String category, Integer radius) {}
}
