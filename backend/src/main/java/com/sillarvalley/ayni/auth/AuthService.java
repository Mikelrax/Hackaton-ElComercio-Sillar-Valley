package com.sillarvalley.ayni.auth;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.PhoneUtils;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserDtos;
import com.sillarvalley.ayni.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        String phone = PhoneUtils.normalize(req.phone(), props.countryCode());
        if (!PhoneUtils.isValid(phone, props.countryCode())) {
            throw ApiException.badRequest("Teléfono inválido. Usa 9 dígitos, por ejemplo 987654321");
        }
        String email = (req.email() == null || req.email().isBlank()) ? null : req.email().trim().toLowerCase();

        if (users.existsByPhone(phone)) {
            throw ApiException.conflict("Ese teléfono ya está registrado");
        }
        if (email != null && users.existsByEmail(email)) {
            throw ApiException.conflict("Ese email ya está registrado");
        }

        Role role = Role.NEIGHBOR;
        if (req.inviteCode() != null && !req.inviteCode().isBlank()) {
            if (!req.inviteCode().trim().equals(props.moderatorInviteCode())) {
                throw ApiException.badRequest("Código de invitación inválido");
            }
            role = Role.MODERATOR;
        }

        User user = new User();
        user.setFullName(req.fullName().trim());
        user.setPhone(phone);
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(role);
        user = users.save(user);
        return respond(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        String id = req.identifier().trim();
        User user = (id.contains("@")
                ? users.findByEmail(id.toLowerCase())
                : users.findByPhone(PhoneUtils.normalize(id, props.countryCode())))
                .orElse(null);

        // Mismo mensaje para usuario inexistente o clave incorrecta (no revelar cuál falló).
        if (user == null || !encoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Credenciales incorrectas");
        }
        if (!user.isActive()) {
            throw ApiException.forbidden("Tu cuenta está desactivada");
        }
        return respond(user);
    }

    private AuthDtos.AuthResponse respond(User user) {
        return new AuthDtos.AuthResponse(jwt.issue(user), "Bearer",
                props.jwtExpirationMinutes() * 60, UserDtos.UserResponse.of(user));
    }
}
