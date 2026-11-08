package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.business.Business;
import com.sillarvalley.ayni.business.BusinessRecommendation;
import com.sillarvalley.ayni.business.BusinessRecommendationRepository;
import com.sillarvalley.ayni.business.BusinessRepository;
import com.sillarvalley.ayni.business.BusinessStatus;
import com.sillarvalley.ayni.business.CategoryRepository;
import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.post.PostType;
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
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(4)
@ConditionalOnProperty(prefix = "app", name = "seed", havingValue = "true")
public class ReviewDemoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ReviewDemoSeeder.class);
    private static final double LAT = -16.3889;
    private static final double LNG = -71.5422;

    private record PostSample(int author, PostType type, Category category, String title, String description) {}

    private record BusinessSample(int author, String name, String category, String description, String phone,
                                  String reference, double dLat, double dLng, String opens, String closes,
                                  String days, String price, String comment) {}

    private static final List<PostSample> POSTS = List.of(
            new PostSample(0, PostType.REQUEST, Category.HERRAMIENTAS, "Busco un taladro prestado para el sábado",
                    "Necesito colgar tres estantes en mi sala. Lo devuelvo el mismo día, limpio y con sus brocas."),
            new PostSample(1, PostType.OFFER, Category.ALIMENTOS, "Regalo verduras de mi huerta",
                    "Tengo lechugas, acelgas y culantro de sobra. Pueden pasar a recogerlas por la tarde, hasta que se acaben."),
            new PostSample(2, PostType.OFFER, Category.EDUCACION, "Clases de computación para adultos mayores",
                    "Enseño a usar el celular, WhatsApp y videollamadas con paciencia. Los domingos en la losa deportiva."),
            new PostSample(0, PostType.REQUEST, Category.CUIDADO, "Alguien que acompañe a mi papá a su cita médica",
                    "<p>Necesito que alguien de confianza lo acompañe el jueves por la mañana al hospital.</p>"
                            + "<ul><li>Sale de casa a las <strong>7:30</strong></li><li>Camina despacio, usa bastón</li></ul>"
                            + "<p>Puedo colaborar con el pasaje.</p>"),
            new PostSample(1, PostType.OFFER, Category.OTROS, "Vendo ropa de bebé en excelente estado",
                    "Mira todo el catálogo en www.modabebe-arequipa.com y escríbenos por WhatsApp para hacer tu pedido."),
            new PostSample(2, PostType.REQUEST, Category.HOGAR, "Necesito un gasfitero con urgencia",
                    "Se rompió una tubería en mi cocina. Llamar al 987 654 321 lo antes posible."),
            new PostSample(0, PostType.OFFER, Category.OTROS, "GANA DINERO RÁPIDO desde tu casa",
                    "Invierte S/ 100 y recibe S/ 500 en una semana, sin riesgo. Escríbeme al privado y te explico cómo entrar al grupo VIP."),
            new PostSample(1, PostType.REQUEST, Category.OTROS, "Necesito dinero urgente, deposítenme por favor",
                    "Mi hijo está grave y necesito S/ 800 hoy. Les pido que me depositen a mi cuenta personal, luego les cuento todo."),
            new PostSample(2, PostType.OFFER, Category.HOGAR, "Cuidado con los de la cuadra 5",
                    "Todos los de la cuadra 5 son unos ladrones y vagos. Que nadie les preste nada ni les dirija la palabra."),
            new PostSample(0, PostType.REQUEST, Category.OTROS, "ayuda", "necesito algo"),
            new PostSample(1, PostType.REQUEST, Category.TRANSPORTE, "Busco quien me lleve al mercado el sábado",
                    "Vivo en Yanahuara y no puedo cargar las bolsas. Si alguien va en auto, le agradecería muchísimo."),
            new PostSample(2, PostType.OFFER, Category.SALUD, "Receto pastillas para bajar de peso sin consulta",
                    "Tengo pastillas milagrosas que curan la diabetes y la presión en dos semanas. Dejen de ir al médico."));

    private static final List<BusinessSample> BUSINESSES = List.of(
            new BusinessSample(0, "Ferretería Los Andes", "otros",
                    "Herramientas, pinturas, tubos y materiales de construcción. Entregas en el barrio.",
                    "986333444", "Frente al paradero de Yanahuara", 0.0035, -0.0040, "08:00", "19:00", "123456",
                    "Precios de mayorista", "Me consiguieron la llave que nadie tenía."),
            new BusinessSample(1, "Panadería Doña Rosa", "comida-casera",
                    "Pan artesanal horneado cada mañana, tres leches y bizcochos por encargo.",
                    "986444555", "A una cuadra de la plaza", -0.0028, 0.0027, "06:00", "13:00", "1234567",
                    "Pan desde S/ 0.30", "El pan sale calientito a las seis."),
            new BusinessSample(2, "Préstamos Rápidos Sin Garantía", "tecnologia",
                    "Préstamos al 20% semanal, sin papeles ni aval. Solicita en www.prestamosya.link o escríbenos ya.",
                    "986555666", null, 0.0090, 0.0060, "00:00", "23:59", "1234567", null, null),
            new BusinessSample(0, "SUPER OFERTA", "otros", "el mejor, compren compren",
                    "986666777", null, -0.0100, -0.0050, "09:00", "18:00", "123456", null, null),
            new BusinessSample(1, "Taller de motos El Rayo", "mecanica",
                    "Reparación de motos lineales y scooters, cambio de llantas y frenos. Repuestos originales.",
                    "986777888", "Por la bajada a Cayma", -0.0075, 0.0100, "08:00", "18:30", "123456",
                    "Revisión gratis", "Me dejó la moto como nueva el mismo día."),
            new BusinessSample(2, "Doctor Milagro: cura todo", "salud",
                    "Curamos cáncer, diabetes y sida con hierbas secretas. Resultados garantizados al 100%, sin análisis ni receta.",
                    "986888999", null, 0.0120, -0.0090, "10:00", "20:00", "123456", "S/ 300 la consulta", null));

    private final UserRepository users;
    private final PostRepository posts;
    private final BusinessRepository businesses;
    private final BusinessRecommendationRepository recommendations;
    private final CategoryRepository categories;

    public ReviewDemoSeeder(UserRepository users, PostRepository posts, BusinessRepository businesses,
                            BusinessRecommendationRepository recommendations, CategoryRepository categories) {
        this.users = users;
        this.posts = posts;
        this.businesses = businesses;
        this.recommendations = recommendations;
        this.categories = categories;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> neighbors = SeedAccounts.users(users).stream().filter(u -> u.getRole() == Role.NEIGHBOR).toList();
        if (neighbors.isEmpty()) {
            return;
        }
        int createdPosts = 0;
        for (PostSample s : POSTS) {
            if (posts.existsByTitle(s.title())) {
                continue;
            }
            User author = neighbors.get(s.author() % neighbors.size());
            Address home = author.primaryAddress().orElse(null);
            if (home == null) {
                continue;
            }
            Post p = new Post();
            p.setAuthor(author);
            p.setType(s.type());
            p.setCategory(s.category());
            p.setTitle(s.title());
            p.setDescription(s.description());
            p.setNeighborhood(home.getNeighborhood());
            p.setLatitude(home.getLatitude());
            p.setLongitude(home.getLongitude());
            p.setStatus(PostStatus.PENDING);
            posts.save(p);
            createdPosts++;
        }
        int createdBusinesses = 0;
        for (BusinessSample s : BUSINESSES) {
            if (businesses.existsByName(s.name())) {
                continue;
            }
            var category = categories.findBySlug(s.category()).orElse(null);
            if (category == null) {
                continue;
            }
            User author = neighbors.get(s.author() % neighbors.size());
            Business b = new Business();
            b.setName(s.name());
            b.setCategory(category);
            b.setDescription(s.description());
            b.setPhone("51" + s.phone());
            b.setReference(s.reference());
            b.setNeighborhood("Yanahuara");
            b.setLatitude(LAT + s.dLat());
            b.setLongitude(LNG + s.dLng());
            b.setOpensAt(LocalTime.parse(s.opens()));
            b.setClosesAt(LocalTime.parse(s.closes()));
            b.setOpenDays(s.days());
            b.setPriceHint(s.price());
            b.setStatus(BusinessStatus.PENDING);
            b.setCreatedBy(author);
            businesses.save(b);

            BusinessRecommendation r = new BusinessRecommendation();
            r.setBusiness(b);
            r.setUser(author);
            r.setGoodPrice(true);
            r.setPunctual(true);
            r.setReliable(true);
            r.setComment(s.comment());
            recommendations.save(r);
            b.addRecommendation(r);
            createdBusinesses++;
        }
        if (createdPosts + createdBusinesses > 0) {
            log.info("Pendientes de ejemplo para la revisión automática: {} publicaciones y {} negocios",
                    createdPosts, createdBusinesses);
        }
    }
}
