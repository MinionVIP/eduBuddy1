
const db = require('../config/db');


const listar = (req, res) => {
    db.query(
        `SELECT e.id_evaluacion, e.id_curso, e.nombre, e.tipo, e.porcentaje, e.fecha,
                e.id_estudiante_creador,
                c.codigo AS curso_codigo, c.nombre AS curso_nombre
         FROM evaluacion e
         JOIN curso c ON c.id_curso = e.id_curso
         ORDER BY e.fecha`,
        (err, filas) => {
            if (err) {
                res.status(500).json({ error: 'Error al listar las evaluaciones' });
                return;
            }
            res.json(filas);
        }
    );
};


const agregar = (req, res) => {
    const { id_curso, nombre, tipo, porcentaje, fecha, id_estudiante_creador } = req.body;

    if (!id_curso || !nombre || !tipo || !fecha) {
        res.status(400).json({ error: 'Curso, nombre, tipo y fecha son obligatorios' });
        return;
    }

    const pct = porcentaje !== undefined && porcentaje !== null ? porcentaje : null;
    const creador = id_estudiante_creador || null;

    const insertarEvaluacion = () => {
        db.query(
            'INSERT INTO evaluacion (id_curso, nombre, tipo, porcentaje, fecha, id_estudiante_creador) VALUES (?, ?, ?, ?, ?, ?)',
            [id_curso, nombre, tipo, pct, fecha, creador],
            (err, resultado) => {
                if (err) return res.status(500).json({ error: 'Error al registrar la evaluacion' });
                res.status(201).json({ id_evaluacion: resultado.insertId, id_curso, nombre, tipo, porcentaje: pct, fecha, id_estudiante_creador: creador });
            }
        );
    };

    if (pct) {
        db.query('SELECT SUM(porcentaje) as total FROM evaluacion WHERE id_curso = ?', [id_curso], (err, filas) => {
            if (err) return res.status(500).json({ error: 'Error al validar porcentajes' });
            const totalActual = filas[0].total ? parseFloat(filas[0].total) : 0;
            if (totalActual + parseFloat(pct) > 100) {
                return res.status(400).json({ error: `La suma de los porcentajes excedería el 100% (Actual: ${totalActual}%)` });
            }
            insertarEvaluacion();
        });
    } else {
        insertarEvaluacion();
    }
};

const editar = (req, res) => {
    const { id } = req.params;
    const { id_curso, nombre, tipo, porcentaje, fecha } = req.body;

    if (!id_curso || !nombre || !tipo || !fecha) {
        res.status(400).json({ error: 'Curso, nombre, tipo y fecha son obligatorios' });
        return;
    }

    const pct = porcentaje !== undefined && porcentaje !== null ? porcentaje : null;

    const actualizarEvaluacion = () => {
        db.query(
            'UPDATE evaluacion SET id_curso = ?, nombre = ?, tipo = ?, porcentaje = ?, fecha = ? WHERE id_evaluacion = ?',
            [id_curso, nombre, tipo, pct, fecha, id],
            (err, resultado) => {
                if (err) return res.status(500).json({ error: 'Error al editar la evaluacion' });
                if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Evaluacion no encontrada' });
                res.json({ id_evaluacion: Number(id), id_curso, nombre, tipo, porcentaje: pct, fecha });
            }
        );
    };

    if (pct) {
        db.query('SELECT SUM(porcentaje) as total FROM evaluacion WHERE id_curso = ? AND id_evaluacion != ?', [id_curso, id], (err, filas) => {
            if (err) return res.status(500).json({ error: 'Error al validar porcentajes' });
            const totalActual = filas[0].total ? parseFloat(filas[0].total) : 0;
            if (totalActual + parseFloat(pct) > 100) {
                return res.status(400).json({ error: `La suma de los porcentajes excedería el 100% (Restante disponible: ${100 - totalActual}%)` });
            }
            actualizarEvaluacion();
        });
    } else {
        actualizarEvaluacion();
    }
};


const eliminar = (req, res) => {
    const { id } = req.params;
    const id_estudiante = req.query.id_estudiante || null;

    if (id_estudiante) {
        // Estudiante: solo puede eliminar evaluaciones que él creó
        db.query(
            'DELETE FROM evaluacion WHERE id_evaluacion = ? AND id_estudiante_creador = ?',
            [id, id_estudiante],
            (err, resultado) => {
                if (err) {
                    res.status(500).json({ error: 'Error al eliminar la evaluacion' });
                    return;
                }
                if (resultado.affectedRows === 0) {
                    res.status(403).json({ error: 'No tienes permiso para eliminar esta evaluacion' });
                    return;
                }
                res.json({ mensaje: 'Evaluacion eliminada correctamente' });
            }
        );
    } else {
        // Admin: puede eliminar cualquiera
        db.query('DELETE FROM evaluacion WHERE id_evaluacion = ?', [id], (err, resultado) => {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar la evaluacion' });
                return;
            }
            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: 'Evaluacion no encontrada' });
                return;
            }
            res.json({ mensaje: 'Evaluacion eliminada correctamente' });
        });
    }
};


const notasDeEvaluacion = async (req, res) => {
    const { id } = req.params;

    try {
        const estNotas = await db.promise().query(
            `SELECT est.id_estudiante, est.nombre, est.apellido, n.calificacion AS nota, nr.calificacion AS nota_recuperacion
             FROM evaluacion e
             JOIN inscripcion i ON i.id_curso = e.id_curso
             JOIN estudiante est ON est.id_estudiante = i.id_estudiante
             LEFT JOIN nota n ON n.id_evaluacion = e.id_evaluacion AND n.id_estudiante = est.id_estudiante
             LEFT JOIN nota_recuperacion nr ON nr.id_evaluacion = e.id_evaluacion AND nr.id_estudiante = est.id_estudiante
             WHERE e.id_evaluacion = ?
             ORDER BY est.apellido, est.nombre`,
            [id]
        );

        const subNotas = await db.promise().query(
            `SELECT sn.* FROM sub_nota sn
             JOIN sub_evaluacion se ON se.id_sub_evaluacion = sn.id_sub_evaluacion
             WHERE se.id_evaluacion = ?`,
            [id]
        );

        res.json({ estudiantes: estNotas[0], subNotas: subNotas[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las notas de la evaluacion' });
    }
};

const guardarNotaRecuperacion = (req, res) => {
    const { id_evaluacion, id_estudiante, calificacion, fecha } = req.body;
    if (!id_evaluacion || !id_estudiante || calificacion === undefined || !fecha) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    db.query(
        `INSERT INTO nota_recuperacion (id_evaluacion, id_estudiante, calificacion, fecha) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE calificacion = ?, fecha = ?`,
        [id_evaluacion, id_estudiante, calificacion, fecha, calificacion, fecha],
        (err) => {
            if (err) return res.status(500).json({ error: 'Error al guardar la nota de recuperación' });
            res.json({ mensaje: 'Nota de recuperación guardada correctamente' });
        }
    );
};

const eliminarNotaRecuperacion = (req, res) => {
    const { id_evaluacion, id_estudiante } = req.params;
    db.query(
        'DELETE FROM nota_recuperacion WHERE id_evaluacion = ? AND id_estudiante = ?',
        [id_evaluacion, id_estudiante],
        (err, resultado) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar la nota de recuperación' });
            if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Nota no encontrada' });
            res.json({ mensaje: 'Nota de recuperación eliminada correctamente' });
        }
    );
};

module.exports = { 
    listar, agregar, editar, eliminar, 
    notasDeEvaluacion, guardarNotaRecuperacion, eliminarNotaRecuperacion 
};
