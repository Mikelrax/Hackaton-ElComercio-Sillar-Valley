package com.sillarvalley.ayni.auth;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.user.User;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final AppProperties props;

    public JwtService(JwtEncoder encoder, AppProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public String issue(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ayni")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(props.jwtExpirationMinutes())))
                .subject(String.valueOf(user.getId()))
                .claim("roles", List.of(user.getRole().name()))
                .claim("name", user.getFullName())
                .build();
        // HS256 explícito: por defecto Spring usaría RS256 y fallaría con clave simétrica.
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
