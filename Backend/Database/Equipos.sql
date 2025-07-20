CREATE TABLE `equipos` (
  `id` int(11) NOT NULL,
  `nne` varchar(50) NOT NULL,
  `id_tipo_equipo` char(1) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `ine` varchar(100) DEFAULT NULL,
  `en_servicio` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;