
import fastify from 'fastify'
import cors from '@fastify/cors';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
import { productsRoutes } from './modules/products/products.routes'
import { companiesRoutes } from './modules/companies/company.routes'
import { categoriesRoutes } from './modules/categories/categories.routes'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(productsRoutes, { prefix: '/products' })
app.register(companiesRoutes, { prefix: '/companies' })
app.register(categoriesRoutes, { prefix: '/categories' })


app.listen({ port: 3333 }).then(() => {
  console.log('🚀 HTTP server running on http://localhost:3333');
});
