const db = require('../config/db');

const listarPorEvaluacion = async (req, res) => {
    const { id_evaluacion } = req.params;
    try {
        const [filas] = await db.promise().query('SELECT * FROM sub_evaluacion WHERE id_evaluacion = ? ORDER BY id_sub_evaluacion', [id_evaluacion]);
        res.json(filas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al listar las sub-evaluaciones' });
    }
};

const agregar = (req, res) => {
    const { id_evaluacion, nombre, porcentaje } = req.body;
    if (!id_evaluacion || !nombre || !porcentaje) {
        return res.status(400).json({ error: 'ID de evaluación, nombre y porcentaje son obligatorios' });
    }

    
    db.query(
        'SELECT SUM(porcentaje) as total FROM sub_evaluacion WHERE id_evaluacion = ?',
        [id_evaluacion],
        (err, filas) => {
            if (err) return res.status(500).json({ error: 'Error al validar porcentajes' });
            
            const totalActual = filas[0].total ? parseFloat(filas[0].total) : 0;
            const nuevoTotal = totalActual + parseFloat(porcentaje);
            
            if (nuevoTotal > 100) {
                return res.status(400).json({ error: `La suma de los porcentajes excedería el 100% (Actual: ${totalActual}%)` });
            }

            db.query(
                'INSERT INTO sub_evaluacion (id_evaluacion, nombre, porcentaje) VALUES (?, ?, ?)',
                [id_evaluacion, nombre, porcentaje],
                (err2, resultado) => {
                    if (err2) return res.status(500).json({ error: 'Error al registrar la sub-evaluación' });
                    res.status(201).json({ 
                        id_sub_evaluacion: resultado.insertId, 
                        id_evaluacion, 
                        nombre, 
                        porcentaje 
                    });
                }
            );
        }
    );
};

const editar = async (req, res) => {
    const { id } = req.params;
    const { nombre, porcentaje } = req.body;
    if (!nombre || !porcentaje) {
        return res.status(400).json({ error: 'Nombre y porcentaje son obligatorios' });
    }

    try {
        // 1. Obtener la sub-evaluación actual para encontrar su id_evaluacion padre
        const [subEvalRows] = await db.promise().query('SELECT id_evaluacion FROM sub_evaluacion WHERE id_sub_evaluacion = ?', [id]);
        if (subEvalRows.length === 0) {
            return res.status(404).json({ error: 'Sub-evaluación no encontrada' });
        }
        const { id_evaluacion } = subEvalRows[0];

        // 2. Validar que el nuevo porcentaje no exceda el 100%
        const [filas] = await db.promise().query(
            'SELECT SUM(porcentaje) as total FROM sub_evaluacion WHERE id_evaluacion = ? AND id_sub_evaluacion != ?',
            [id_evaluacion, id]
        );
        const totalActual = filas[0].total ? parseFloat(filas[0].total) : 0;
        const nuevoTotal = totalActual + parseFloat(porcentaje);

        if (nuevoTotal > 100) {
            return res.status(400).json({ error: `La suma de los porcentajes excedería el 100% (Restante disponible: ${100 - totalActual}%)` });
        }

        // 3. Actualizar la sub-evaluación
        await db.promise().query('UPDATE sub_evaluacion SET nombre = ?, porcentaje = ? WHERE id_sub_evaluacion = ?', [nombre, porcentaje, id]);

        res.json({ id_sub_evaluacion: Number(id), id_evaluacion, nombre, porcentaje });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al editar la sub-evaluación' });
    }
};

const eliminar = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM sub_evaluacion WHERE id_sub_evaluacion = ?', [id], (err, resultado) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar la sub-evaluación' });
        if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Sub-evaluación no encontrada' });
        res.json({ mensaje: 'Sub-evaluación eliminada correctamente' });
    });
};

const listarSubNotas = (req, res) => {
    const { id_sub_evaluacion } = req.params;
    db.query(
        `SELECT est.id_estudiante, est.nombre, est.apellido, sn.calificacion AS nota
         FROM sub_evaluacion se
         JOIN evaluacion e ON e.id_evaluacion = se.id_evaluacion
         JOIN inscripcion i ON i.id_curso = e.id_curso
         JOIN estudiante est ON est.id_estudiante = i.id_estudiante
         LEFT JOIN sub_nota sn ON sn.id_sub_evaluacion = se.id_sub_evaluacion AND sn.id_estudiante = est.id_estudiante
         WHERE se.id_sub_evaluacion = ?
         ORDER BY est.apellido, est.nombre`,
        [id_sub_evaluacion],
        (err, filas) => {
            if (err) return res.status(500).json({ error: 'Error al obtener las notas del sub-criterio' });
            res.json(filas);
        }
    );
};

const guardarSubNota = (req, res) => {
    const { id_sub_evaluacion, id_estudiante, calificacion } = req.body;
    if (!id_sub_evaluacion || !id_estudiante || calificacion === undefined || calificacion === null) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    db.query(
        `INSERT INTO sub_nota (id_sub_evaluacion, id_estudiante, calificacion) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE calificacion = ?`,
        [id_sub_evaluacion, id_estudiante, calificacion, calificacion],
        (err) => {
            if (err) return res.status(500).json({ error: 'Error al guardar la nota' });
            res.json({ mensaje: 'Nota guardada correctamente' });
        }
    );
};

const eliminarSubNota = (req, res) => {
    const { id_sub_evaluacion, id_estudiante } = req.params;
    db.query(
        'DELETE FROM sub_nota WHERE id_sub_evaluacion = ? AND id_estudiante = ?',
        [id_sub_evaluacion, id_estudiante],
        (err, resultado) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar la nota' });
            if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Nota no encontrada' });
            res.json({ mensaje: 'Nota eliminada correctamente' });
        }
    );
};

module.exports = { 
    listarPorEvaluacion, agregar, editar, eliminar, 
    listarSubNotas, guardarSubNota, eliminarSubNota 
};
