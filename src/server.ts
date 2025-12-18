
import fastify from 'fastify'
import cors from '@fastify/cors';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { productsRoutes } from './modules/products/products.routes.js'
import { companiesRoutes } from './modules/companies/company.routes.js'
import { categoriesRoutes } from './modules/categories/categories.routes.js'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.get("/", () => {
  return {
    message: "Hello World"
  }
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

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

app.register(productsRoutes, { prefix: '/products' })
app.register(companiesRoutes, { prefix: '/companies' })
app.register(categoriesRoutes, { prefix: '/categories' })

app.listen({ 
  port: Number(process.env.PORT) || 3333, 
  host: '0.0.0.0' // OBRIGATÓRIO para deploy em nuvem
}).then(() => {
  console.log('🚀 HTTP server running!');
});
