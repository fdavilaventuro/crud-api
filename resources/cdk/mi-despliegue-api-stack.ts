// lib/mi-despliegue-api-stack.ts

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'; // Para la Red Virtual (VPC)
import * as ecs from 'aws-cdk-lib/aws-ecs'; // Para el Servicio de Contenedores (ECS)
import * as ecr from 'aws-cdk-lib/aws-ecr'; // Para referenciar nuestro repositorio ECR
import * as iam from 'aws-cdk-lib/aws-iam'; // Para referenciar el Rol de IAM
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'; // Para patrones de despliegue sencillos

export class MiDespliegueApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // --- 1. Definir la Red (VPC) ---
        const vpc = new ec2.Vpc(this, 'MiVpc', {
            maxAzs: 2,
            restrictDefaultSecurityGroup: false // 👈 evita crear roles adicionales
        });

        // --- 2. Crear el Cluster de ECS ---
        const cluster = new ecs.Cluster(this, 'MiCluster', {
            vpc: vpc // Usamos la VPC que acabamos de crear
        });

        // --- 3. Referenciar el Rol de IAM existente (LabRole) --- 
        const labRoleArn = 'arn:aws:iam::000870181791:role/LabRole';
        const taskRole = iam.Role.fromRoleArn(this, 'LabRoleImportado', labRoleArn, {
            mutable: false,
        });

        // --- 4. Referenciar tu Repositorio de ECR existente ---
        const repository = ecr.Repository.fromRepositoryName(this, 'ApiRepo', 'crud-api-repo');

        // --- 5. Crear el Servicio Fargate con Balanceador de Carga ---
        new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MiServicioFargate', {
            cluster: cluster,       // El clúster donde se ejecutará
            cpu: 256,               // 0.25 vCPU
            memoryLimitMiB: 512,    // 512 MB de RAM
            desiredCount: 1,        // Ejecutar 1 instancia de nuestro contenedor
            taskImageOptions: {
                image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'), // La imagen a usar
                containerPort: 80,
                taskRole: taskRole,
                executionRole: taskRole,
            },
            publicLoadBalancer: true // Queremos que sea accesible desde internet
        });
    }
}