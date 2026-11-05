package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogLineageEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for lineage edges (Lot 5).
 *
 * Traversal methods:
 *  - {@link #findByDownstreamId} — upstream walk (find what feeds into a node)
 *  - {@link #findByUpstreamId}   — downstream walk (find what a node feeds into)
 */
@Repository
public interface CatalogLineageEdgeRepository extends JpaRepository<CatalogLineageEdge, String> {

    /** Find all edges whose downstream entity matches the given id (upstream traversal). */
    List<CatalogLineageEdge> findByDownstreamId(String downstreamId);

    /** Find all edges whose upstream entity matches the given id (downstream traversal). */
    List<CatalogLineageEdge> findByUpstreamId(String upstreamId);
}
