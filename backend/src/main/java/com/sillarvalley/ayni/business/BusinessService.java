package com.sillarvalley.ayni.business;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.PhoneUtils;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessService {

    public static final double DEFAULT_LATITUDE = -16.3988;
    public static final double DEFAULT_LONGITUDE = -71.535;

    private final BusinessRepository businesses;
    private final CategoryRepository categories;
    private final BusinessRecommendationRepository recommendations;
    private final BusinessSearch search;
    private final CurrentUser currentUser;
    private final ZoneId zone;
    private final String countryCode;

    public BusinessService(BusinessRepository businesses, CategoryRepository categories,
                           BusinessRecommendationRepository recommendations, BusinessSearch search,
                           CurrentUser currentUser, AppProperties props) {
        this.businesses = businesses;
        this.categories = categories;
        this.recommendations = recommendations;
        this.search = search;
        this.currentUser = currentUser;
        this.zone = ZoneId.of(props.timezone());
        this.countryCode = props.countryCode();
    }

    @Transactional(readOnly = true)
    public BusinessDtos.SearchResponse search(Long uid, String query, String category, Double lat, Double lng,
                                              Integer radius, boolean openNow, String sort, int page, int size) {
        currentUser.require(uid);
        LocalDateTime now = LocalDateTime.now(zone);
        var result = search.search(new BusinessSearch.Criteria(query, category, lat, lng,
                radius == null || radius <= 0 ? null : Math.min(radius, 50_000), openNow, "distance".equals(sort),
                Math.max(page, 0), Math.min(Math.max(size, 1), 50), now.toLocalTime(), now.getDayOfWeek().getValue()));

        List<BusinessDtos.BusinessSummary> content = result.rows().stream().map(r -> new BusinessDtos.BusinessSummary(
                r.id(), r.name(), r.categorySlug(), r.categoryName(), r.categoryIcon(), r.neighborhood(),
                r.distance() == null ? null : (int) Math.round(r.distance()),
                OpeningHours.isOpen(r.opensAt(), r.closesAt(), r.openDays(), now),
                OpeningHours.describe(r.opensAt(), r.closesAt(), r.openDays(), now),
                r.recommendations(), new BusinessDtos.Tags(r.goodPrice(), r.punctual(), r.reliable()),
                r.latitude(), r.longitude())).toList();
        List<BusinessDtos.CategoryResponse> facets = result.facets().stream()
                .map(f -> new BusinessDtos.CategoryResponse(f.slug(), f.name(), f.icon(), f.count())).toList();
        return new BusinessDtos.SearchResponse(content, result.total(), facets);
    }

    @Transactional(readOnly = true)
    public List<BusinessDtos.CategoryResponse> categories() {
        return categories.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(c -> new BusinessDtos.CategoryResponse(c.getSlug(), c.getName(), c.getIcon(), 0))
                .toList();
    }

    @Transactional(readOnly = true)
    public BusinessDtos.BusinessDetail detail(Long uid, Long id, Double lat, Double lng) {
        User user = currentUser.require(uid);
        Business b = find(id);
        boolean privileged = b.getCreatedBy().getId().equals(uid) || user.getRole() == Role.MODERATOR;
        if (b.getStatus() != BusinessStatus.APPROVED && !privileged) {
            throw ApiException.notFound("Negocio no encontrado");
        }
        return toDetail(b, uid, lat, lng);
    }

    @Transactional
    public BusinessDtos.BusinessDetail create(Long uid, BusinessDtos.CreateBusinessRequest req) {
        User user = currentUser.require(uid);
        Category category = categories.findBySlug(req.categorySlug())
                .orElseThrow(() -> ApiException.badRequest("Esa categoría no existe"));
        Address home = user.primaryAddress().orElse(null);

        Business b = new Business();
        b.setName(req.name().trim());
        b.setCategory(category);
        b.setDescription(blankToNull(req.description()));
        b.setPhone(normalizePhone(req.phone()));
        b.setNeighborhood(firstNonBlank(req.neighborhood(), home == null ? null : home.getNeighborhood(), "Arequipa"));
        b.setReference(blankToNull(req.reference()));
        b.setLatitude(req.latitude() != null ? req.latitude()
                : home != null && home.getLatitude() != null ? home.getLatitude() : DEFAULT_LATITUDE);
        b.setLongitude(req.longitude() != null ? req.longitude()
                : home != null && home.getLongitude() != null ? home.getLongitude() : DEFAULT_LONGITUDE);
        b.setOpensAt(req.opensAt() == null ? null : LocalTime.parse(req.opensAt()));
        b.setClosesAt(req.closesAt() == null ? null : LocalTime.parse(req.closesAt()));
        b.setOpenDays(blankToNull(req.openDays()));
        b.setPriceHint(blankToNull(req.priceHint()));
        b.setCreatedBy(user);
        b.setStatus(user.getRole() == Role.MODERATOR ? BusinessStatus.APPROVED : BusinessStatus.PENDING);
        if (b.getStatus() == BusinessStatus.APPROVED) {
            b.setModeratedBy(user);
        }
        businesses.save(b);

        if (req.recommendation() != null) {
            addRecommendation(b, user, req.recommendation());
        }
        return toDetail(b, uid, null, null);
    }

    @Transactional
    public BusinessDtos.BusinessDetail recommend(Long uid, Long id, BusinessDtos.RecommendRequest req) {
        User user = currentUser.require(uid);
        Business b = find(id);
        if (b.getStatus() != BusinessStatus.APPROVED) {
            throw ApiException.conflict("Este negocio todavía no está publicado");
        }
        if (recommendations.existsByBusinessIdAndUserId(id, uid)) {
            throw ApiException.conflict("Ya recomendaste este negocio");
        }
        addRecommendation(b, user, req);
        return toDetail(b, uid, null, null);
    }

    @Transactional(readOnly = true)
    public List<BusinessDtos.BusinessDetail> listPending(Long uid) {
        requireModerator(uid);
        return businesses.findByStatusOrderByCreatedAtAsc(BusinessStatus.PENDING, PageRequest.of(0, 50))
                .map(b -> toDetail(b, uid, null, null)).getContent();
    }

    @Transactional
    public BusinessDtos.BusinessDetail approve(Long uid, Long id) {
        User mod = requireModerator(uid);
        Business b = findPending(id);
        b.setStatus(BusinessStatus.APPROVED);
        b.setModeratedBy(mod);
        b.setModerationNote(null);
        return toDetail(b, uid, null, null);
    }

    @Transactional
    public BusinessDtos.BusinessDetail reject(Long uid, Long id, String note) {
        User mod = requireModerator(uid);
        Business b = findPending(id);
        b.setStatus(BusinessStatus.REJECTED);
        b.setModeratedBy(mod);
        b.setModerationNote(note.trim());
        return toDetail(b, uid, null, null);
    }

    private void addRecommendation(Business b, User user, BusinessDtos.RecommendRequest req) {
        BusinessRecommendation r = new BusinessRecommendation();
        r.setBusiness(b);
        r.setUser(user);
        r.setGoodPrice(req.goodPrice());
        r.setPunctual(req.punctual());
        r.setReliable(req.reliable());
        r.setComment(blankToNull(req.comment()));
        recommendations.save(r);
        b.addRecommendation(r);
    }

    private BusinessDtos.BusinessDetail toDetail(Business b, Long uid, Double lat, Double lng) {
        LocalDateTime now = LocalDateTime.now(zone);
        Integer distance = lat == null || lng == null ? null
                : (int) Math.round(distanceMeters(lat, lng, b.getLatitude(), b.getLongitude()));
        List<BusinessDtos.RecommendationResponse> recent = b.getId() == null ? List.of()
                : recommendations.findTop10ByBusinessIdOrderByCreatedAtDesc(b.getId()).stream()
                .map(r -> new BusinessDtos.RecommendationResponse(firstName(r.getUser().getFullName()),
                        r.isGoodPrice(), r.isPunctual(), r.isReliable(), r.getComment(), r.getCreatedAt()))
                .toList();
        boolean mine = b.getId() != null && recommendations.existsByBusinessIdAndUserId(b.getId(), uid);
        return new BusinessDtos.BusinessDetail(b.getId(), b.getName(), b.getCategory().getSlug(),
                b.getCategory().getName(), b.getCategory().getIcon(), b.getDescription(), b.getPhone(),
                b.getNeighborhood(), b.getReference(), distance,
                OpeningHours.isOpen(b.getOpensAt(), b.getClosesAt(), b.getOpenDays(), now),
                OpeningHours.describe(b.getOpensAt(), b.getClosesAt(), b.getOpenDays(), now),
                b.getPriceHint(), b.getRecommendationsCount(),
                new BusinessDtos.Tags(b.getGoodPriceCount(), b.getPunctualCount(), b.getReliableCount()),
                b.getLatitude(), b.getLongitude(), b.getStatus(), b.getModerationNote(),
                firstName(b.getCreatedBy().getFullName()), mine, recent, b.getCreatedAt());
    }

    public static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return 6_371_000 * 2 * Math.asin(Math.sqrt(a));
    }

    private String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String phone = PhoneUtils.normalize(raw, countryCode);
        if (!PhoneUtils.isValid(phone, countryCode)) {
            throw ApiException.badRequest("El teléfono debe tener 9 dígitos, por ejemplo 987654321");
        }
        return phone;
    }

    private Business find(Long id) {
        return businesses.findById(id).orElseThrow(() -> ApiException.notFound("Negocio no encontrado"));
    }

    private Business findPending(Long id) {
        Business b = find(id);
        if (b.getStatus() != BusinessStatus.PENDING) {
            throw ApiException.conflict("Este negocio no está pendiente de revisión");
        }
        return b;
    }

    private User requireModerator(Long uid) {
        User u = currentUser.require(uid);
        if (u.getRole() != Role.MODERATOR) {
            throw ApiException.forbidden("Solo los moderadores pueden hacer esto");
        }
        return u;
    }

    private static String firstName(String fullName) {
        return fullName == null ? "" : fullName.trim().split("\\s+")[0];
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
