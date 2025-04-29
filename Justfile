kyverno-test:
  #!/bin/bash
  set -e
  pushd kyverno-tests
  kyverno test . -f prevent-controlplane-tolerations.yaml
  kyverno test . -f prevent-empty-dir.yaml
  kyverno test . -f prevent-too-many-containers.yaml
  kyverno test . -f prevent-too-many-replicas.yaml
  kyverno test . -f mutate-runtime-class.yaml
