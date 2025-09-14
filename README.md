# crud-api
Los 3 archivos en la raíz son los usados para crear la imagen

En la carpeta resources están los archivos necesarios para crear los contenedores

## Orden de comandos

### copiar repo con api
git clone https://github.com/fdavilaventuro/crud-api.git

### vaiables de entorno
export AWS_ACCOUNT_ID=000870181791
export AWS_REGION=us-east-1
export REPO_NAME=crud-api-repo
export IMAGE_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:latest

### Construye la imagen desde el Dockerfile
docker build -t ${REPO_NAME} .

#Etiqueta la imagen para ECR
docker tag ${REPO_NAME}:latest ${IMAGE_URI}

### crear repo
aws ecr create-repository \
    --repository-name crud-api-repo \
    --region us-east-1 \
    --image-scanning-configuration scanOnPush=true

### Subir la imagen al repositorio de ECR
docker push ${IMAGE_URI}

000870181791.dkr.ecr.us-east-1.amazonaws.com/crud-api-repo:latest

vpc-033464f29d9bf9537 

arn:aws:iam::000870181791:role/LabRole

### Cloudformation se hace todo en la consola de AWS

### CDK

mkdir mi-despliegue-api
cd mi-despliegue-api

cdk init app --language typescript

nano lib/mi-despliegue-api-stack.ts
nano bin/mi-despliegue-api.ts

export NODE_OPTIONS=--max-old-space-size=1536
npm run build

cdk bootstrap -r "arn:aws:iam::000870181791:role/LabRole" --profile "default" --template aws-cdk-bootstrap.yaml

cdk deploy --require-approval never

cdk destroy

https://gist.github.com/zrierc/541fea845980b7d4887c349d4f0efe71#file-aws-cdk-bootstrap-yaml-L1
https://www.linkedin.com/pulse/aws-cdk-hack-academy-learner-lab-wong-chun-yin-cyrus-%E9%BB%83%E4%BF%8A%E5%BD%A5-

### terraform

mkdir mi-despliegue-api-tf
cd mi-despliegue-api-tf

touch main.tf variables.tf outputs.tf provider.tf

nano provider.tf
nano main.tf

terraform init
terraform plan
terraform apply -auto-approve

terradorm destroy -auto-approve

### pulumi

curl -fsSL https://get.pulumi.com | sh
exec bash

mkdir mi-despliegue-api-pulumi
cd mi-despliegue-api-pulumi

pulumi new aws-typescript --name mi-despliegue-api

### hacer login cuando lo pida (usar t0k3n)

nano index.ts

pulumi up --yes

pulumi destroy --yes && pulumi stack rm $(pulumi stack --show-name) --yes
