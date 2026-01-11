
import fastify from 'fastify'
import cors from '@fastify/cors';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import fastifyJwt from '@fastify/jwt';
import { productsRoutes } from './modules/products/products.routes.js'
import { companiesRoutes } from './modules/companies/company.routes.js'
import { categoriesRoutes } from './modules/categories/categories.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js';
import { financeRoutes } from './modules/finance/finance.routes.js';
import { revenueRoutes } from './modules/revenue/revenue.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = fastify()

app.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true,
})

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
})

app.get("/", () => {
  return {
    message: "Hello World"
  }
})

app.setValidatorCompiler(validatorCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.setErrorHandler(errorHandler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SmartResto API',
      description: 'API documentation for SmartResto Financial Management',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform, // This is crucial for Zod to OpenAI checks
});

app.register(fastifyApiReference, {
  routePrefix: '/docs',
  configuration: {
    title: 'SmartResto API Docs',
  },
});

app.register(authRoutes, { prefix: '/auth' })
app.register(productsRoutes, { prefix: '/products' })
app.register(companiesRoutes, { prefix: '/companies' })
app.register(categoriesRoutes, { prefix: '/categories' })
app.register(financeRoutes, { prefix: '/finance' })
app.register(revenueRoutes, { prefix: '/revenue' })

app.listen({ 
  port: Number(process.env.PORT) || 3333, 
  host: '0.0.0.0' // OBRIGATÓRIO para deploy em nuvem
}).then(() => {
  console.log('🚀 HTTP server running!');
});
