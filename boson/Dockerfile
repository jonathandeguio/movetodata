# Shyne Specific

ARG JDK_PACKAGE=openjdk-11.0.2_linux-x64_bin.tar.gz
ARG SPARK_HOME=/opt/spark
ARG JAVA_HOME=/opt/java
ARG SPARK_VERSION=3.4.3
ARG SPARK_PACKAGE=spark-$SPARK_VERSION-bin-hadoop3.tgz

# Base image stage 2
FROM --platform=linux/amd64 ubuntu as spark

ARG JAVA_HOME
ARG SPARK_HOME
ARG SPARK_PACKAGE
ARG SPARK_VERSION

WORKDIR /opt/

# Download Spark
ADD https://archive.apache.org/dist/spark/spark-$SPARK_VERSION/$SPARK_PACKAGE /
#ADD https://dlcdn.apache.org/spark/spark-$SPARK_VERSION/$SPARK_PACKAGE /

RUN mkdir -p $SPARK_HOME/  && \
    tar -zxf /$SPARK_PACKAGE --strip-components 1  -C $SPARK_HOME  && \
    rm -f $SPARK_PACKAGE

FROM --platform=linux/amd64 gradle:7.6.1-jdk11
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN ./gradlew build --no-daemon -x test

RUN mkdir -p /app/
RUN mv /home/gradle/src/build/libs/*.jar /app/

ARG SPARK_HOME
ARG SPARK_PACKAGE
ARG SPARK_VERSION

WORKDIR /opt/

# Below is for Builds and full platform

# Get artifacts from previous stages
COPY --from=spark $SPARK_HOME $SPARK_HOME

ENV SPARK_HOME $SPARK_HOME

# Setup paths
ENV PATH $PATH:$JAVA_HOME/bin
ENV PATH $PATH:$SPARK_HOME/bin
ENV PYTHONPATH $PYTHONPATH:$SPARK_HOME/python:$SPARK_HOME/python/lib/py4j-0.10.4-src.zip

# Adding custom jars for backing fs and db etc
COPY dependencies/custom_jars.txt /tmp/custom_jars.txt

# Download and add the dependencies to $SPARK_HOME/jars
RUN while read -r url filename; do \
    echo "Copying jars $SPARK_HOME/jars/$filename $url" && \
    curl -sSLo "$SPARK_HOME/jars/$filename" "$url" && \
    chmod 644 "$SPARK_HOME/jars/$filename"; \
done < /tmp/custom_jars.txt

# Configure Spark to use local JAR files
RUN echo "spark.jars /opt/spark/jars/aws-java-sdk-bundle.jar,/opt/spark/jars/hadoop-aws-3.3.2.jar,/opt/spark/jars/wildfly-openssl-1.0.7.Final.jar,/opt/spark/jars/gcs-connector-hadoop3-latest.jar,/opt/spark/jars/google-cloud-storage.jar,/opt/spark/jars/org.eclipse.jgit.jar,/opt/spark/jars/google-auth-library-credentials.jar,/opt/spark/jars/google-auth-library-oauth2-http.jar,/opt/spark/jars/postgresql.jar,/opt/spark/jars/minio.jar" >> $SPARK_HOME/conf/spark-defaults.conf

USER root

# COPY dependency files
RUN mkdir dependencies
COPY dependencies/packages.txt dependencies/
COPY funnel/dependencies/requirements.txt dependencies/

RUN \
    apt-get -qq update && \
    apt-get -qq upgrade -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -qq -y $(tr -d '\r' < dependencies/packages.txt) && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# --- ODBC/FreeTDS : configuration systeme ---
# Copie des fichiers de configuration ODBC dans le conteneur
COPY dependencies/odbcinst.ini /etc/odbcinst.ini
COPY dependencies/odbc.ini     /etc/odbc.ini

# Variables d'environnement pour que unixODBC trouve les fichiers de config
ENV ODBCSYSINI=/etc
ENV ODBCINI=/etc/odbc.ini

# Verification au build : lister les drivers enregistres
RUN odbcinst -q -d && echo "unixODBC drivers OK" || echo "WARNING: odbcinst check failed"

RUN pip install -q --upgrade pip && \
  pip install -q --upgrade -r dependencies/requirements.txt

WORKDIR /opt/
RUN mkdir /opt/funnel/
COPY ./funnel /opt/funnel

## Install PySpark and Numpy
RUN \
    pip3 install --upgrade pip && \
    pip3 -q install /opt/funnel/

COPY shyneEntrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/shyneEntrypoint.sh

COPY src/main/resources/application.yml /app/
RUN mkdir /app/FractalTemplates/
COPY /FractalTemplates/ /app/FractalTemplates/
RUN cp /app/*.jar $SPARK_HOME/jars/

ENTRYPOINT ["/usr/bin/shyneEntrypoint.sh"]
USER root