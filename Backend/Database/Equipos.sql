CREATE TABLE `equipos` (
  `id` int(11) NOT NULL,
  `nne` varchar(50) NOT NULL,
  `ni` varchar(50) DEFAULT NULL,
  `id_tipo_equipo` char(1) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `ine` varchar(100) DEFAULT NULL,
  `en_servicio` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar clave primaria
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`id`);

-- Agregar auto incremento
ALTER TABLE `equipos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Crear índice único para NNE
CREATE UNIQUE INDEX idx_equipos_nne ON equipos(nne);

-- Crear índice único para NI
CREATE UNIQUE INDEX idx_equipos_ni ON equipos(ni);