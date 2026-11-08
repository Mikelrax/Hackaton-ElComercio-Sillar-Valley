package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.post.PostType;
import com.sillarvalley.ayni.response.HelpResponse;
import com.sillarvalley.ayni.response.HelpResponseRepository;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
@ConditionalOnProperty(prefix = "app", name = "seed", havingValue = "true")
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final PostRepository posts;
    private final HelpResponseRepository responses;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, PostRepository posts, HelpResponseRepository responses,
                      PasswordEncoder encoder) {
        this.users = users;
        this.posts = posts;
        this.responses = responses;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User rosa = ensure(SeedAccounts.ROSA);
        User luis = ensure(SeedAccounts.LUIS);
        User carmen = ensure(SeedAccounts.CARMEN);
        ensure(SeedAccounts.JULIO);

        if (posts.count() > 0) {
            return;
        }
        Post pedido = post(luis, PostType.REQUEST, Category.HERRAMIENTAS, "Necesito una escalera prestada",
                "Voy a pintar el frente de mi casa este fin de semana y necesito una escalera de 3 metros.",
                PostStatus.APPROVED, rosa);
        post(carmen, PostType.OFFER, Category.EDUCACION, "Refuerzo escolar gratis (primaria)",
                "Puedo ayudar con tareas de matemática y comunicación los martes y jueves por la tarde.",
                PostStatus.APPROVED, rosa);
        post(rosa, PostType.OFFER, Category.ALIMENTOS, "Olla común el sábado",
                "Se necesitan manos para cocinar en la losa deportiva a las 9 am. Todos son bienvenidos.",
                PostStatus.APPROVED, rosa);
        post(luis, PostType.REQUEST, Category.CUIDADO, "Alguien que cuide a mi mamá 2 horas",
                "Necesito salir a hacer un trámite el miércoles por la mañana.",
                PostStatus.PENDING, null);

        HelpResponse r = new HelpResponse();
        r.setPost(pedido);
        r.setHelper(carmen);
        r.setMessage("Tengo una escalera de aluminio, te la presto el sábado temprano.");
        responses.save(r);

        log.info("Publicaciones de ejemplo creadas");
    }

    private User ensure(SeedAccounts.Account account) {
        User user = users.findByPhone(account.phone()).orElseGet(() -> create(account));
        if (user.getAddresses().isEmpty()) {
            user.addAddress(home(account.home()));
            log.info("Dirección de ejemplo agregada a {}", user.getFullName());
        }
        return users.save(user);
    }

    private User create(SeedAccounts.Account account) {
        User u = new User();
        u.setFullName(account.fullName());
        u.setPhone(account.phone());
        u.setEmail(account.email());
        u.setPasswordHash(encoder.encode(account.password()));
        u.setRole(account.role());
        log.info("Usuario de ejemplo creado: {} ({})", account.fullName(), account.role());
        return u;
    }

    private static Address home(SeedAccounts.Home home) {
        Address a = new Address();
        a.setLabel("Casa");
        a.setNeighborhood(home.neighborhood());
        a.setReference(home.reference());
        a.setLatitude(home.latitude());
        a.setLongitude(home.longitude());
        return a;
    }

    private Post post(User author, PostType type, Category cat, String title, String desc,
                      PostStatus status, User moderator) {
        Post p = new Post();
        p.setAuthor(author);
        p.setType(type);
        p.setCategory(cat);
        p.setTitle(title);
        p.setDescription(desc);
        p.setNeighborhood(author.primaryAddress().map(Address::getNeighborhood).orElse(null));
        p.setStatus(status);
        p.setModeratedBy(moderator);
        return posts.save(p);
    }
}
