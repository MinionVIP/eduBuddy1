
Integrantes:
Tatiana Abarca Urra: Cree el readme, Hice el login.html completo y validaciones simples, diseñe la base de datos e inserte datos de prueba, para completar el flujo del login tambien hice el authController.js para el modelo de autenticacion. Corregi errores, 
Ana Belen Campos
Demian Abarzua




Descripcion del proyecto/Tema Educacion: 
EduBuddy es una pagina web con funcionalidades academicas para Estudiantes, que permite calcular tu promedio con simulacion de notas, organizar tu calendario con proximas pruebas y visualizar tus materias disponibles .
Tambien tiene una vista Para el pandel de administracion , que permite un CRUD completo para estudiantes , materias, profesores y evaluaciones. 

Porfavor antes instalar las siguientes dependencias: 
├── bcryptjs@3.0.3
├── express@4.22.2
└── mysql2@3.22.5
(dependencia externa-> gitbash)
Ademas de levantar el servicio de XAMPP y copiar completo lo que esta dentro de sql.sql para poder tener acceso a la base de dato. 

Instalación paso a paso: 
Despues de copiar la query completa, en phpmyadmin se debe de crear la bd pegando la query, para instalar las dependencias señaladas mas arriba se debe de usar el comando npm install ('nombre de dependencia') . Para arrancar el proyecto despues de instalar todo, usar npm start. OJO QUE TODOS LOS COMANDOS SE EJECUTAN POR TERMINAL GITBASH. 

Configuracion de la base de datos: 
host: 'localhost',
    user: 'root',
    password: '',
    database: 'sistema_educativo'

    la base de datos esta configurada para que las contraseñas esten cifradas, se uso bcryptjs para eso

Credenciales de prueba:
juan.perez@alumno.cl juan123
admin@instituto.cl admin123

Uso del sistema: 
Primero se debe de ingresar los datos para iniciar sesion. Va a depender del rol ingresado de la cuenta logeada para definir que vista se va a mostrar; Usuario o Administrador, la vista de estudiante es bastante limitada en relacion a un CRUD, pero tiene mas funcionalidades como registrar notas , sacar promedio por % , obtener un promedio general, planificar pruebas, ingresar tareas entre otros que apareceran como pendientes. 
El panel de administracion permite un CRUD completo sobre estudiantes, materias, profesores y evaluaciones. 

Estructura del proyecto:
eduBuddy1/
├── server.js                      # Punto de entrada: configura Express, sirve archivos estaticos y monta todas las rutas /api
├── sql.sql                        # Script de creacion de la BD (sistema_educativo) con tablas y datos de ejemplo
├── package.json                   # Dependencias del proyecto (express, mysql2, bcryptjs)
│
├── config/
│   └── db.js                      # Conexion a MySQL (mysql2) reutilizada por todos los controladores
│
├── models/
│   └── Estudiante.js              # Clase simple que representa la forma de un estudiante
│
├── controllers/
│   ├── authController.js          # Login: valida credenciales contra la tabla usuario (bcrypt)
│   ├── estudianteController.js    # CRUD de estudiantes + perfil academico + guardar/eliminar notas
│   ├── cursoController.js         # CRUD de materias (cursos)
│   ├── profesorController.js      # CRUD de profesores
│   └── evaluacionController.js    # CRUD de evaluaciones + listado de notas por evaluacion
│
├── routes/
│   ├── auth.js                    # POST /api/auth/login
│   ├── estudiantes.js             # /api/estudiantes (CRUD, perfil, notas)
│   ├── cursos.js                  # /api/cursos (CRUD)
│   ├── profesores.js              # /api/profesores (CRUD)
│   └── evaluaciones.js            # /api/evaluaciones (CRUD + notas por evaluacion)
│
├── public/                        # Archivos estaticos servidos directo por Express
│   ├── index.html                 # Pantalla de login (misma que login.html, servida en "/")
│   ├── login.html                 # Pantalla de login, ruta /login
│   ├── dashboard.html             # Panel del estudiante: notas, materias, evaluaciones, perfil
│   └── img/                       # Logo y mascota usados en el login
│
└── views/
    └── admin.html                 # Panel del administrador: CRUD completo de estudiantes, materias, profesores y evaluaciones/notas


