import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// 📍 Basic network info
const vpc = aws.ec2.getVpcOutput({ default: true });
const subnets = aws.ec2.getSubnetsOutput({ filters: [{ name: "vpc-id", values: [vpc.id] }] });

// ⚙️ Use existing LabRole
const executionRoleArn = "arn:aws:iam::000870181791:role/LabRole";

// 📦 ECS Cluster
const cluster = new aws.ecs.Cluster("api-cluster", {});

// 📋 Task Definition
const taskDefinition = new aws.ecs.TaskDefinition("api-task", {
    family: "api-task",
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: executionRoleArn,
    containerDefinitions: JSON.stringify([{
        name: "api-container",
        image: "000870181791.dkr.ecr.us-east-1.amazonaws.com/crud-api-repo:latest",
        essential: true,
        portMappings: [{ containerPort: 80, protocol: "tcp" }],
    }]),
});

// 🌐 Load Balancer + Security Group
const lbSecurityGroup = new aws.ec2.SecurityGroup("lb-sg", {
    vpcId: vpc.id,
    description: "Allow HTTP",
    ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
});

const alb = new aws.lb.LoadBalancer("api-alb", {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [lbSecurityGroup.id],
    subnets: subnets.ids,
});

const targetGroup = new aws.lb.TargetGroup("api-tg", {
    port: 80,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpc.id,
});

const listener = new aws.lb.Listener("api-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
});

// 🚀 Fargate Service + Security Group
const serviceSecurityGroup = new aws.ec2.SecurityGroup("service-sg", {
    vpcId: vpc.id,
    description: "Allow traffic from ALB",
    ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, securityGroups: [lbSecurityGroup.id] }],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
});

const service = new aws.ecs.Service("api-service", {
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 1,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: subnets.ids,
        securityGroups: [serviceSecurityGroup.id],
        assignPublicIp: true,
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "api-container",
        containerPort: 80,
    }],
}, { dependsOn: [listener] });

// 📤 Output
export const url = alb.dnsName;
