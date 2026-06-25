CREATE DATABASE sistema_educativo;
USE sistema_educativo;


CREATE TABLE estudiante (id_estudiante INT AUTO_INCREMENT PRIMARY KEY,rut VARCHAR(12) UNIQUE NOT NULL,nombre VARCHAR(100) NOT NULL,apellido VARCHAR(100) NOT NULL,correo VARCHAR(150) UNIQUE NOT NULL,
    carrera VARCHAR(100) NOT NULL,fecha_ingreso DATE NOT NULL,estado ENUM('Activo','Inactivo') DEFAULT 'Activo');


CREATE TABLE profesor (id_profesor INT AUTO_INCREMENT PRIMARY KEY,nombre VARCHAR(100) NOT NULL,apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL);


CREATE TABLE curso (id_curso INT AUTO_INCREMENT PRIMARY KEY,codigo VARCHAR(20) UNIQUE NOT NULL,nombre VARCHAR(100) NOT NULL,
    creditos INT NOT NULL,modo_calculo ENUM('promedio','porcentaje') DEFAULT 'promedio',id_profesor INT,FOREIGN KEY (id_profesor) REFERENCES profesor(id_profesor));


CREATE TABLE inscripcion (id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,id_estudiante INT NOT NULL,id_curso INT NOT NULL,
    fecha_inscripcion DATE NOT NULL,FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso),UNIQUE(id_estudiante, id_curso));


CREATE TABLE horario (id_horario INT AUTO_INCREMENT PRIMARY KEY,id_curso INT NOT NULL,dia_semana ENUM(
        'Lunes',
        'Martes',
        'Miercoles',
        'Jueves',
        'Viernes',
        'Sabado'
    ) NOT NULL,
    hora_inicio TIME NOT NULL,hora_fin TIME NOT NULL,sala VARCHAR(50),FOREIGN KEY (id_curso) REFERENCES curso(id_curso));


CREATE TABLE evaluacion (
    id_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_curso INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM(
        'Prueba',
        'Control',
        'Tarea',
        'Trabajo',
        'Examen'
    ) NOT NULL,
    porcentaje DECIMAL(5,2) NULL DEFAULT NULL,
    fecha DATE NOT NULL,
    id_estudiante_creador INT NULL DEFAULT NULL,
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    FOREIGN KEY (id_estudiante_creador) REFERENCES estudiante(id_estudiante));


CREATE TABLE nota (id_nota INT AUTO_INCREMENT PRIMARY KEY,id_estudiante INT NOT NULL,id_evaluacion INT NOT NULL,
    calificacion DECIMAL(3,1) NOT NULL,FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    FOREIGN KEY (id_evaluacion) REFERENCES evaluacion(id_evaluacion),

    UNIQUE(id_estudiante, id_evaluacion));


CREATE TABLE apunte (id_apunte INT AUTO_INCREMENT PRIMARY KEY,id_estudiante INT NOT NULL,id_curso INT NULL,titulo VARCHAR(150) NOT NULL,
    contenido TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso) ON DELETE CASCADE);

CREATE TABLE sub_evaluacion (
    id_sub_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_evaluacion INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_evaluacion) REFERENCES evaluacion(id_evaluacion) ON DELETE CASCADE
);

CREATE TABLE sub_nota (
    id_sub_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_sub_evaluacion INT NOT NULL,
    id_estudiante INT NOT NULL,
    calificacion DECIMAL(3,1) NOT NULL,
    FOREIGN KEY (id_sub_evaluacion) REFERENCES sub_evaluacion(id_sub_evaluacion) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante) ON DELETE CASCADE,
    UNIQUE(id_sub_evaluacion, id_estudiante)
);

CREATE TABLE nota_recuperacion (
    id_nota_recuperacion INT AUTO_INCREMENT PRIMARY KEY,
    id_evaluacion INT NOT NULL,
    id_estudiante INT NOT NULL,
    calificacion DECIMAL(3,1) NOT NULL,
    fecha DATE NOT NULL,
    FOREIGN KEY (id_evaluacion) REFERENCES evaluacion(id_evaluacion) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante) ON DELETE CASCADE,
    UNIQUE(id_evaluacion, id_estudiante)
);

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN','ESTUDIANTE') NOT NULL,
    estado ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO'
);

-- USUARIOS (password_hash generado con bcrypt; contraseñas en texto plano: admin123 / juan123 / maria123)
INSERT INTO usuario (correo, password_hash, rol) VALUES
('admin@instituto.cl', '$2b$10$PzyKSl3KSDd0WsLa2Yrqy.TbNQZE1.VkwAIRKo5bzQpol3rwQ13pC', 'ADMIN'),
('juan.perez@alumno.cl', '$2b$10$UR51Y6xHd2USgAsjsrUR5uXocyBH3M7072d/dY3lUf5ZAJ5j9YFea', 'ESTUDIANTE'),
('maria.gonzalez@alumno.cl', '$2b$10$A0KUCHEWW1CA4Rv0uMUw5ONHVGOyQ6A1T3Bvztettmok0w01.7c2C', 'ESTUDIANTE');

-- ESTUDIANTES
INSERT INTO estudiante (rut, nombre, apellido, correo, carrera, fecha_ingreso) VALUES
('20111222-3', 'Juan', 'Perez', 'juan.perez@alumno.cl', 'Ingenieria Informatica', '2024-03-01'),
('19888777-1', 'Maria', 'Gonzalez', 'maria.gonzalez@alumno.cl', 'Ingenieria Informatica', '2024-03-01');

-- PROFESORES
INSERT INTO profesor (nombre, apellido, correo) VALUES
('Carlos', 'Mendez', 'cmendez@instituto.cl'),
('Ana', 'Rojas', 'arojas@instituto.cl'),
('Pedro', 'Silva', 'psilva@instituto.cl');

-- CURSOS
INSERT INTO curso (codigo, nombre, creditos, id_profesor) VALUES
('INF101', 'Programacion I', 6, 1),
('BD102', 'Base de Datos', 5, 2),
('WEB103', 'Desarrollo Web', 5, 3);

-- INSCRIPCIONES
INSERT INTO inscripcion (id_estudiante, id_curso, fecha_inscripcion) VALUES
(1, 1, '2026-03-01'),
(1, 2, '2026-03-01'),
(1, 3, '2026-03-01'),
(2, 1, '2026-03-01'),
(2, 2, '2026-03-01');

-- HORARIOS
INSERT INTO horario (id_curso, dia_semana, hora_inicio, hora_fin, sala) VALUES
(1, 'Lunes', '08:30:00', '10:00:00', 'Lab-01'),
(1, 'Miercoles', '08:30:00', '10:00:00', 'Lab-01'),

(2, 'Martes', '10:15:00', '11:45:00', 'Sala-12'),
(2, 'Jueves', '10:15:00', '11:45:00', 'Sala-12'),

(3, 'Viernes', '09:00:00', '11:00:00', 'Lab-Web');

-- EVALUACIONES
INSERT INTO evaluacion (id_curso, nombre, tipo, porcentaje, fecha) VALUES
(1, 'Prueba 1 Programacion', 'Prueba', 30.00, '2026-07-05'),
(1, 'Trabajo POO', 'Trabajo', 20.00, '2026-07-15'),

(2, 'Control SQL', 'Control', 20.00, '2026-06-25'),
(2, 'Prueba Base de Datos', 'Prueba', 30.00, '2026-07-10'),

(3, 'Proyecto Web', 'Trabajo', 40.00, '2026-07-20'),
(3, 'Examen Final', 'Examen', 60.00, '2026-08-01');

-- NOTAS JUAN
INSERT INTO nota (id_estudiante, id_evaluacion, calificacion) VALUES
(1, 1, 6.0),
(1, 2, 5.8),
(1, 3, 6.5),
(1, 4, 5.9),
(1, 5, 6.2);

-- NOTAS MARIA
INSERT INTO nota (id_estudiante, id_evaluacion, calificacion) VALUES
(2, 1, 5.5),
(2, 2, 6.3),
(2, 3, 5.8),
(2, 4, 6.0);


INSERT INTO apunte (id_estudiante, titulo, contenido) VALUES
(1, 'Apuntes SQL', 'Repasar SELECT, JOIN, GROUP BY y subconsultas.'),
(1, 'Programacion Orientada a Objetos', 'Revisar herencia, encapsulamiento y polimorfismo.'),
(2, 'Modelo Relacional', 'Estudiar claves primarias y foraneas.');