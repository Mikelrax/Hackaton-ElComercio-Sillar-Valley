package com.sillarvalley.ayni.post;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    Page<Post> findByStatusOrderByCreatedAtAsc(PostStatus status, Pageable pageable);

    List<Post> findByStatusAndAutoReviewIsNull(PostStatus status);

    List<Post> findByStatusAndFulfilledAtBefore(PostStatus status, java.time.Instant before);
}
