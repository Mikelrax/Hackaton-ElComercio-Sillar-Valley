package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.util.List;
import java.util.Optional;

public final class SeedAccounts {

    private SeedAccounts() {}

    public static List<User> users(UserRepository repository) {
        return ALL.stream().map(a -> repository.findByPhone(a.phone())).flatMap(Optional::stream).toList();
    }

    public record Home(String neighborhood, String reference, double latitude, double longitude) {}

    public record Account(String fullName, String phone, String email, String password, Role role, Home home) {}

    public record Demo(String key, String title, String summary, String phone) {}

    public static final Account ROSA = new Account("Rosa Quispe", "51900000001", "rosa@ayni.local", "Moderador123",
            Role.MODERATOR, new Home("Yanahuara", "Junto al mirador", -16.3884, -71.5418));

    public static final Account LUIS = new Account("Luis Mamani", "51900000002", "luis@ayni.local", "Vecino1234",
            Role.NEIGHBOR, new Home("Yanahuara", "Calle Jerusalén, cerca de la plaza", -16.3896, -71.5436));

    public static final Account CARMEN = new Account("Carmen Huamán", "51900000003", null, "Vecino1234",
            Role.NEIGHBOR, new Home("Cayma", "Frente a la iglesia de Cayma", -16.3716, -71.5469));

    public static final Account JULIO = new Account("Julio Ccori", "51900000004", null, "Vecino1234",
            Role.NEIGHBOR, new Home("Cercado - Arequipa", "A dos cuadras de la Plaza de Armas", -16.3985, -71.5372));

    public static final List<Account> ALL = List.of(ROSA, LUIS, CARMEN, JULIO);

    public static final List<Demo> DEMO = List.of(
            new Demo("vecino", "Vecino", "Busca servicios, pide o ofrece favores y reporta emergencias", LUIS.phone()),
            new Demo("moderador", "Moderador (Junta SOS)", "Aprueba publicaciones y activa el modo emergencia",
                    ROSA.phone()));
}
