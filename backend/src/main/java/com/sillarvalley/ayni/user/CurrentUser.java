package com.sillarvalley.ayni.user;

import com.sillarvalley.ayni.common.ApiException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Carga al usuario autenticado desde la BD. Así un usuario desactivado por un moderador
 * queda bloqueado al instante aunque su JWT todavía no haya expirado.
 * Llamar siempre dentro de una transacción (los servicios ya son @Transactional).
 */
@Component
public class CurrentUser {

    private final UserRepository users;

    public CurrentUser(UserRepository users) {
        this.users = users;
    }

    public static Long idOf(Jwt jwt) {
        try {
            return Long.valueOf(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw ApiException.unauthorized("Token inválido");
        }
    }

    public User require(Long userId) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.unauthorized("El usuario ya no existe"));
        if (!u.isActive()) {
            throw ApiException.forbidden("Tu cuenta está desactivada");
        }
        return u;
    }
}
