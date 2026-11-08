package com.sillarvalley.ayni.auth;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.seed.SeedAccounts;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoAccessService {

    private final UserRepository users;
    private final AuthService auth;
    private final boolean enabled;

    public DemoAccessService(UserRepository users, AuthService auth, AppProperties props) {
        this.users = users;
        this.auth = auth;
        this.enabled = props.seed();
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.DemoAccount> accounts() {
        if (!enabled) {
            return List.of();
        }
        return SeedAccounts.DEMO.stream()
                .flatMap(demo -> find(demo).map(user -> new AuthDtos.DemoAccount(demo.key(), demo.title(),
                        demo.summary(), user.getRole(), user.getFullName(),
                        user.primaryAddress().map(Address::getNeighborhood).orElse(null))).stream())
                .toList();
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(String key) {
        if (!enabled) {
            throw ApiException.notFound("Las cuentas de demostración no están activas");
        }
        User user = SeedAccounts.DEMO.stream()
                .filter(demo -> demo.key().equals(key))
                .findFirst()
                .flatMap(this::find)
                .orElseThrow(() -> ApiException.notFound("Esa cuenta de demostración no existe"));
        return auth.respond(user);
    }

    private Optional<User> find(SeedAccounts.Demo demo) {
        return users.findByPhone(demo.phone()).filter(User::isActive);
    }
}
