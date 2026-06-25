

const db = require('../config/db');
const Estudiante = require('../models/Estudiante');


const listar = (req, res) => {
    db.query('SELECT * FROM estudiante', (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar estudiantes' });
            return;
        }

        const estudiantes = filas.map(
            (fila) => new Estudiante(fila.id_estudiante, fila.rut, fila.nombre, fila.apellido, fila.correo, fila.carrera, fila.fecha_ingreso, fila.estado)
        );
        res.json(estudiantes);
    });
};


const agregar = (req, res) => {
    const { rut, nombre, apellido, correo, carrera, fecha_ingreso, estado } = req.body;

    if (!rut || !nombre || !apellido || !correo || !carrera || !fecha_ingreso) {
        res.status(400).json({ error: 'Rut, nombre, apellido, correo, carrera y fecha de ingreso son obligatorios' });
        return;
    }

    db.query(
        'INSERT INTO estudiante (rut, nombre, apellido, correo, carrera, fecha_ingreso, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [rut, nombre, apellido, correo, carrera, fecha_ingreso, estado || 'Activo'],
        (err, resultado) => {
            if (err) {
                res.status(500).json({ error: 'Error al registrar el estudiante' });
                return;
            }

            const nuevo = new Estudiante(resultado.insertId, rut, nombre, apellido, correo, carrera, fecha_ingreso, estado || 'Activo');
            res.status(201).json(nuevo);
        }
    );
};


const editar = (req, res) => {
    const { id } = req.params;
    const { rut, nombre, apellido, correo, carrera, fecha_ingreso, estado } = req.body;

    if (!rut || !nombre || !apellido || !correo || !carrera || !fecha_ingreso) {
        res.status(400).json({ error: 'Rut, nombre, apellido, correo, carrera y fecha de ingreso son obligatorios' });
        return;
    }

    db.query(
        'UPDATE estudiante SET rut = ?, nombre = ?, apellido = ?, correo = ?, carrera = ?, fecha_ingreso = ?, estado = ? WHERE id_estudiante = ?',
        [rut, nombre, apellido, correo, carrera, fecha_ingreso, estado || 'Activo', id],
        (err, resultado) => {
            if (err) {
                res.status(500).json({ error: 'Error al editar el estudiante' });
                return;
            }

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: 'Estudiante no encontrado' });
                return;
            }
            res.json(new Estudiante(id, rut, nombre, apellido, correo, carrera, fecha_ingreso, estado || 'Activo'));
        }
    );
};


const eliminar = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM estudiante WHERE id_estudiante = ?', [id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al eliminar el estudiante' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Estudiante no encontrado' });
            return;
        }
        res.json({ mensaje: 'Estudiante eliminado correctamente' });
    });
};

const perfil = (req, res) => {
    const { correo } = req.params;

    db.query('SELECT * FROM estudiante WHERE correo = ?', [correo], (err, estudiantes) => {
        if (err) return res.status(500).json({ error: 'Error al obtener el estudiante' });
        if (estudiantes.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });

        const estudiante = estudiantes[0];

        db.query(
            `SELECT c.id_curso, c.codigo, c.nombre, c.creditos, c.modo_calculo, c.id_profesor
             FROM curso c
             JOIN inscripcion i ON i.id_curso = c.id_curso
             WHERE i.id_estudiante = ?
             ORDER BY c.id_curso`, [estudiante.id_estudiante], (err, materias) => {
                if (err) return res.status(500).json({ error: 'Error al obtener los cursos del estudiante' });
                if (materias.length === 0) return res.json({ estudiante, materias: [], evaluaciones: [] });

                const idsCursos = materias.map((m) => m.id_curso);

                db.query(
                    `SELECT e.id_evaluacion, e.id_curso, e.nombre, e.tipo, e.porcentaje, e.fecha,
                            e.id_estudiante_creador, n.calificacion AS nota
                     FROM evaluacion e
                     LEFT JOIN nota n ON n.id_evaluacion = e.id_evaluacion AND n.id_estudiante = ?
                     WHERE e.id_curso IN (?) AND (e.id_estudiante_creador IS NULL OR e.id_estudiante_creador = ?)
                     ORDER BY e.fecha`,
                    [estudiante.id_estudiante, idsCursos, estudiante.id_estudiante],
                    (err, evaluaciones) => {
                        if (err) return res.status(500).json({ error: 'Error al obtener evaluaciones' });

                        const idsEvaluaciones = evaluaciones.length > 0 ? evaluaciones.map(e => e.id_evaluacion) : [0];

                        db.query(
                            `SELECT * FROM sub_evaluacion WHERE id_evaluacion IN (?)`,
                            [idsEvaluaciones],
                            (err, subEvaluaciones) => {
                                if (err) return res.status(500).json({ error: 'Error al obtener sub-evaluaciones' });
                                
                                db.query(
                                    `SELECT sn.* FROM sub_nota sn 
                                     JOIN sub_evaluacion se ON se.id_sub_evaluacion = sn.id_sub_evaluacion
                                     WHERE se.id_evaluacion IN (?) AND sn.id_estudiante = ?`,
                                    [idsEvaluaciones, estudiante.id_estudiante],
                                    (err, subNotas) => {
                                        if (err) return res.status(500).json({ error: 'Error al obtener sub-notas' });
                                        
                                        db.query(
                                            `SELECT * FROM nota_recuperacion WHERE id_evaluacion IN (?) AND id_estudiante = ?`,
                                            [idsEvaluaciones, estudiante.id_estudiante],
                                            (err, recuperaciones) => {
                                                if (err) return res.status(500).json({ error: 'Error al obtener notas de recuperación' });

                                                res.json({ 
                                                    estudiante, 
                                                    materias, 
                                                    evaluaciones, 
                                                    subEvaluaciones, 
                                                    subNotas, 
                                                    recuperaciones 
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};


const guardarNota = (req, res) => {
    const { id_estudiante, id_evaluacion, calificacion } = req.body;

    if (!id_estudiante || !id_evaluacion || calificacion === undefined || calificacion === null) {
        res.status(400).json({ error: 'id_estudiante, id_evaluacion y calificacion son obligatorios' });
        return;
    }

    db.query(
        `INSERT INTO nota (id_estudiante, id_evaluacion, calificacion) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE calificacion = ?`,
        [id_estudiante, id_evaluacion, calificacion, calificacion],
        (err) => {
            if (err) {
                res.status(500).json({ error: 'Error al guardar la nota' });
                return;
            }
            res.json({ mensaje: 'Nota guardada correctamente' });
        }
    );
};

const eliminarNota = (req, res) => {
    const { id_estudiante, id_evaluacion } = req.params;

    db.query(
        'DELETE FROM nota WHERE id_estudiante = ? AND id_evaluacion = ?',
        [id_estudiante, id_evaluacion],
        (err, resultado) => {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar la nota' });
                return;
            }
            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: 'Nota no encontrada' });
                return;
            }
            res.json({ mensaje: 'Nota eliminada correctamente' });
        }
    );
};

module.exports = { listar, agregar, editar, eliminar, perfil, guardarNota, eliminarNota };
