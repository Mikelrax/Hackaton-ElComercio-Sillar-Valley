package com.sillarvalley.ayni.response;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HelpResponseRepository extends JpaRepository<HelpResponse, Long> {

    List<HelpResponse> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<HelpResponse> findByHelperIdOrderByCreatedAtDesc(Long helperId);

    boolean existsByPostIdAndHelperId(Long postId, Long helperId);

    boolean existsByPostIdAndStatus(Long postId, HelpStatus status);

    Optional<HelpResponse> findFirstByPostIdAndStatus(Long postId, HelpStatus status);
}
