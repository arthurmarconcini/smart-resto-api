
import fastify from 'fastify'
import cors from '@fastify/cors';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
import { productsRoutes } from './modules/products/products.routes.js'
import { companiesRoutes } from './modules/companies/company.routes.js'
import { categoriesRoutes } from './modules/categories/categories.routes.js'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(productsRoutes, { prefix: '/products' })
app.register(companiesRoutes, { prefix: '/companies' })
app.register(categoriesRoutes, { prefix: '/categories' })


app.listen({ 
  port: Number(process.env.PORT) || 3333, 
  host: '0.0.0.0' // OBRIGATÓRIO para deploy em nuvem
}).then(() => {
  console.log('🚀 HTTP server running!');
});
