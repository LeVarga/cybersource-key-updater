FROM node:21-alpine as build

WORKDIR /app

COPY ./package.json /app/
COPY ./package-lock.json /app/

RUN npm install

COPY ./ /app/

RUN npm run build

FROM nginx:1.25.3-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
