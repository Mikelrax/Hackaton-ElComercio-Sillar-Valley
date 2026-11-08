package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.post.PostType;
import com.sillarvalley.ayni.response.HelpResponse;
import com.sillarvalley.ayni.response.HelpResponseRepository;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Datos de ejemplo para desarrollo. Solo corre si app.seed=true Y la tabla users está vacía,
 * así que nunca duplica ni pisa datos reales. En producción usa APP_SEED=false.
 */
@Component
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
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        User rosa = user("Rosa Quispe", "51900000001", "rosa@ayni.local", "Moderador123", Role.MODERATOR);
        User luis = user("Luis Mamani", "51900000002", "luis@ayni.local", "Vecino1234", Role.NEIGHBOR);
        User carmen = user("Carmen Huamán", "51900000003", null, "Vecino1234", Role.NEIGHBOR);
        user("Julio Ccori", "51900000004", null, "Vecino1234", Role.NEIGHBOR);

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

        log.info("Datos de ejemplo creados. Moderador: 51900000001 / Moderador123 — Vecinos: 51900000002..4 / Vecino1234");
    }

    private User user(String name, String phone, String email, String password, Role role) {
        User u = new User();
        u.setFullName(name);
        u.setPhone(phone);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role);
        return users.save(u);
    }

    private Post post(User author, PostType type, Category cat, String title, String desc,
                      PostStatus status, User moderator) {
        Post p = new Post();
        p.setAuthor(author);
        p.setType(type);
        p.setCategory(cat);
        p.setTitle(title);
        p.setDescription(desc);
        p.setNeighborhood("Sector central");
        p.setStatus(status);
        p.setModeratedBy(moderator);
        return posts.save(p);
    }
}
