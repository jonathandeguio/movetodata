package io.movetodata.snap.deployments.library.models;


import com.fasterxml.jackson.annotation.JsonBackReference;
import io.movetodata.snap.deployments.library.Enums.ConfigurationState;
import lombok.*;

import javax.persistence.*;
import java.util.Date;
import java.util.UUID;

@Builder
@Entity
@RequiredArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Table(name = "configuration_components")
public class ConfigurationComponentsModel {

    public @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    UUID id;
    String frontend;
    String boson;
    String parler;
    String julia;
    String callisto;
    String capture;
    String moveToDataDocs;
    String sparkHistoryServer;
    String globalVersion;
    String branch;

    @Enumerated(EnumType.STRING)
    ConfigurationState state;  // ACTIVE(1) boson: 0.4.8 | TARGET (1) boson: 0.4.8 | ARCHIVED (30)

    Date deployedAt;

    @ManyToOne()
    @JoinColumn(name = "deployments_id")
    @JsonBackReference
    private DeploymentModel deploymentModel;
}
