const db = require('../config/db');

const listar = (req, res) => {
    const { id_estudiante, id_curso } = req.query;
    if (!id_estudiante) return res.status(400).json({ error: 'Falta id_estudiante' });

    let query = 'SELECT * FROM apunte WHERE id_estudiante = ?';
    let params = [id_estudiante];

    if (id_curso) {
        query += ' AND id_curso = ?';
        params.push(id_curso);
    }
    query += ' ORDER BY fecha_actualizacion DESC';

    db.query(query, params, (err, filas) => {
        if (err) return res.status(500).json({ error: 'Error al listar los apuntes' });
        res.json(filas);
    });
};

const agregar = (req, res) => {
    const { id_estudiante, id_curso, titulo, contenido } = req.body;
    if (!id_estudiante || !titulo) {
        return res.status(400).json({ error: 'Estudiante y título son obligatorios' });
    }

    db.query(
        'INSERT INTO apunte (id_estudiante, id_curso, titulo, contenido) VALUES (?, ?, ?, ?)',
        [id_estudiante, id_curso || null, titulo, contenido || ''],
        (err, resultado) => {
            if (err) return res.status(500).json({ error: 'Error al crear el apunte' });
            res.status(201).json({ 
                id_apunte: resultado.insertId, 
                id_estudiante, 
                id_curso: id_curso || null, 
                titulo, 
                contenido 
            });
        }
    );
};

const editar = (req, res) => {
    const { id } = req.params;
    const { id_curso, titulo, contenido } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título es obligatorio' });

    db.query(
        'UPDATE apunte SET id_curso = ?, titulo = ?, contenido = ? WHERE id_apunte = ?',
        [id_curso || null, titulo, contenido || '', id],
        (err, resultado) => {
            if (err) return res.status(500).json({ error: 'Error al editar el apunte' });
            if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Apunte no encontrado' });
            res.json({ id_apunte: Number(id), id_curso: id_curso || null, titulo, contenido });
        }
    );
};

const eliminar = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM apunte WHERE id_apunte = ?', [id], (err, resultado) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar el apunte' });
        if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Apunte no encontrado' });
        res.json({ mensaje: 'Apunte eliminado' });
    });
};

module.exports = { listar, agregar, editar, eliminar };
