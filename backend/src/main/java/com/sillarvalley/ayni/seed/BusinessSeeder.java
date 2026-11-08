package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.business.Business;
import com.sillarvalley.ayni.business.BusinessRecommendation;
import com.sillarvalley.ayni.business.BusinessRecommendationRepository;
import com.sillarvalley.ayni.business.BusinessRepository;
import com.sillarvalley.ayni.business.BusinessStatus;
import com.sillarvalley.ayni.business.CategoryRepository;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.LocalTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
@ConditionalOnProperty(prefix = "app", name = "seed", havingValue = "true")
public class BusinessSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BusinessSeeder.class);
    private static final double LAT = -16.3889;
    private static final double LNG = -71.5422;

    private record Sample(String name, String category, String description, String phone, double dLat, double dLng,
                          String opens, String closes, String days, String price, int recommenders,
                          boolean goodPrice, boolean punctual, boolean reliable, String comment) {}

    private static final List<Sample> SAMPLES = List.of(
            new Sample("Gasfitería Don Lucho", "gasfiteria",
                    "Arreglo de fugas, instalación de termas y destape de desagües. Atiende emergencias.",
                    "987111222", 0.0030, 0.0012, "07:00", "19:00", "123456", "Desde S/ 30", 4,
                    true, true, true, "Vino el mismo día y dejó todo limpio."),
            new Sample("Menús de la señora Marta", "comida-casera",
                    "Menú del día con entrada, segundo y refresco. También para llevar.",
                    "987222333", -0.0015, 0.0018, "12:00", "15:30", "123456", "Menú S/ 10", 4,
                    true, false, true, "El ají de gallina es el mejor del barrio."),
            new Sample("Costura y arreglos Carmen", "costura",
                    "Bastas, cierres y arreglos de ropa para el mismo día.",
                    "987333444", 0.0048, -0.0021, "09:00", "18:00", "123456", "Desde S/ 5", 3,
                    true, true, false, "Me arregló el terno en una hora."),
            new Sample("Bodega El Vecino", "bodega",
                    "Abarrotes, pan caliente de la mañana y recargas.",
                    "987444555", -0.0009, -0.0008, "06:30", "22:00", "1234567", null, 3,
                    true, false, true, null),
            new Sample("Electricista Ramiro", "electricidad",
                    "Instalaciones, cortocircuitos y cambio de tableros. Trabajo garantizado.",
                    "987555666", 0.0062, 0.0040, "08:00", "18:00", "12345", "Visita S/ 20", 2,
                    false, true, true, "Muy puntual y explica todo."),
            new Sample("Botica San José", "salud",
                    "Medicinas, inyectables y control de presión.",
                    "987666777", -0.0041, 0.0035, "08:00", "22:00", "1234567", null, 3,
                    false, true, true, null),
            new Sample("Peluquería Estilo", "belleza",
                    "Cortes para damas, caballeros y niños. Manicure.",
                    "987777888", 0.0021, -0.0052, "10:00", "20:00", "234567", "Corte S/ 12", 2,
                    true, false, false, null),
            new Sample("Clases con la profe Julia", "clases",
                    "Refuerzo de matemática y comunicación para primaria y secundaria.",
                    "987888999", -0.0070, -0.0030, "15:00", "19:00", "12345", "S/ 15 la hora", 2,
                    true, true, true, "Mi hijo subió sus notas en un mes."),
            new Sample("Reparación de celulares TecnoFix", "tecnologia",
                    "Cambio de pantalla, batería y puerto de carga en el día.",
                    "987999000", 0.0080, 0.0015, "10:00", "20:00", "123456", null, 1,
                    false, true, false, null),
            new Sample("Taller mecánico Chávez", "mecanica",
                    "Mantenimiento de autos y motos, cambio de aceite y frenos.",
                    "986111222", -0.0120, 0.0090, "08:00", "18:00", "123456", null, 1,
                    false, false, true, null),
            new Sample("Carpintería Huamán", "carpinteria",
                    "Muebles a medida, puertas y closets.",
                    "986222333", 0.0190, -0.0120, "08:00", "17:00", "123456", null, 1,
                    true, false, true, null));

    private final BusinessRepository businesses;
    private final BusinessRecommendationRepository recommendations;
    private final CategoryRepository categories;
    private final UserRepository users;

    public BusinessSeeder(BusinessRepository businesses, BusinessRecommendationRepository recommendations,
                          CategoryRepository categories, UserRepository users) {
        this.businesses = businesses;
        this.recommendations = recommendations;
        this.categories = categories;
        this.users = users;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (businesses.count() > 0) {
            return;
        }
        List<User> people = users.findAll(Sort.by("id"));
        if (people.isEmpty()) {
            return;
        }
        User moderator = people.stream().filter(u -> u.getRole() == Role.MODERATOR).findFirst().orElse(people.get(0));

        for (Sample s : SAMPLES) {
            Business b = new Business();
            b.setName(s.name());
            b.setCategory(categories.findBySlug(s.category()).orElseThrow());
            b.setDescription(s.description());
            b.setPhone("51" + s.phone());
            b.setNeighborhood("Yanahuara");
            b.setLatitude(LAT + s.dLat());
            b.setLongitude(LNG + s.dLng());
            b.setOpensAt(LocalTime.parse(s.opens()));
            b.setClosesAt(LocalTime.parse(s.closes()));
            b.setOpenDays(s.days());
            b.setPriceHint(s.price());
            b.setStatus(BusinessStatus.APPROVED);
            b.setCreatedBy(moderator);
            b.setModeratedBy(moderator);
            businesses.save(b);

            for (int i = 0; i < Math.min(s.recommenders(), people.size()); i++) {
                BusinessRecommendation r = new BusinessRecommendation();
                r.setBusiness(b);
                r.setUser(people.get(i));
                r.setGoodPrice(s.goodPrice());
                r.setPunctual(s.punctual());
                r.setReliable(s.reliable());
                r.setComment(i == 0 ? s.comment() : null);
                recommendations.save(r);
                b.addRecommendation(r);
            }
        }
        log.info("Negocios de ejemplo creados: {}", SAMPLES.size());
    }
}
