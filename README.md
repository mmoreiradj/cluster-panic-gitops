## Getting started

```bash
kubectl create ns db-namespace
kubectl create ns app-namespace
helmfile sync
kubectl apply -f manifests/admin 
```