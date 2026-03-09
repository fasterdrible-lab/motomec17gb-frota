-- ============================================================
-- Mototec 17º GB - Dados iniciais / seed
-- Execute após schema.sql
-- ============================================================

-- Usuários iniciais (senhas em bcrypt — placeholder para troca em produção)
-- Senha padrão de todos: Admin@2024
INSERT INTO usuarios (nome, email, hashed_password, cargo, unidade, role) VALUES
    ('Administrador Sistema',  'admin@17gb.bombeiros.gov.br',    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZfSJCZ9wL0i0KCE4HCuKS', 'Administrador',         '1SGB', 'admin'),
    ('Sgt Mecânico Silva',     'mecanico.silva@17gb.bombeiros.gov.br', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZfSJCZ9wL0i0KCE4HCuKS', 'Sargento Mecânico',    '1SGB', 'editor'),
    ('Cb Motorista Santos',    'motorista.santos@17gb.bombeiros.gov.br','$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZfSJCZ9wL0i0KCE4HCuKS', 'Cabo Motorista',       '2SGB', 'editor'),
    ('Ten Comandante Pereira', 'comandante@17gb.bombeiros.gov.br',     '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZfSJCZ9wL0i0KCE4HCuKS', 'Tenente Comandante',   '1SGB', 'leitor'),
    ('Sd Apoio Costa',         'apoio.costa@17gb.bombeiros.gov.br',    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZfSJCZ9wL0i0KCE4HCuKS', 'Soldado de Apoio',     '2SGB', 'leitor')
ON CONFLICT (email) DO NOTHING;

-- Viaturas de exemplo
INSERT INTO viaturas (placa, prefixo, modelo, marca, ano, unidade, status, km_atual, valor_fipe) VALUES
    ('ABC-1234', 'UR-01', 'Sprinter 415', 'Mercedes-Benz', 2020, '1SGB', 'operando', 45230.5, 185000.00),
    ('DEF-5678', 'AB-02', 'CB 500 F',     'Honda',          2021, '1SGB', 'operando', 12400.0, 28000.00),
    ('GHI-9012', 'AB-03', 'Lander 250',   'Yamaha',         2019, '2SGB', 'manutencao', 32100.0, 18500.00),
    ('JKL-3456', 'UR-04', 'Master 2.3',   'Renault',        2018, '2SGB', 'operando', 78950.0, 120000.00),
    ('MNO-7890', 'AB-05', 'Fazer 250',    'Yamaha',         2022, '1SGB', 'reserva',  3200.0, 16000.00)
ON CONFLICT (placa) DO NOTHING;

-- Manutenções preventivas de exemplo
INSERT INTO manutencao_preventiva (viatura_id, tipo, km_proximo, data_proxima, status, km_ultima, data_ultima, responsavel, observacoes) VALUES
    (1, 'troca_oleo',    55000, NOW() + INTERVAL '45 days', 'pendente', 45000, NOW() - INTERVAL '30 days', 'Sgt Silva', 'Óleo 5W30 sintético'),
    (1, 'revisao_freio', 60000, NOW() + INTERVAL '90 days', 'pendente', 45000, NOW() - INTERVAL '60 days', 'Sgt Silva', 'Pastilhas dianteiras trocadas'),
    (2, 'troca_oleo',    13000, NOW() + INTERVAL '5 days',  'pendente', 12000, NOW() - INTERVAL '150 days','Sgt Silva', 'Óleo 10W40'),
    (3, 'revisao_geral', 35000, NOW() - INTERVAL '2 days',  'vencida',  30000, NOW() - INTERVAL '200 days','Sgt Silva', 'Revisão completa necessária'),
    (4, 'troca_pneus',   90000, NOW() + INTERVAL '120 days','pendente', 75000, NOW() - INTERVAL '90 days', 'Sgt Silva', 'Pneus traseiros desgastados');

-- Abastecimentos de exemplo
INSERT INTO abastecimento (viatura_id, data, km, quantidade_litros, valor_total, preco_litro, responsavel) VALUES
    (1, NOW() - INTERVAL '2 days',  45100, 45.0, 270.00, 6.00, 'Cb Santos'),
    (1, NOW() - INTERVAL '10 days', 44800, 50.0, 300.00, 6.00, 'Cb Santos'),
    (2, NOW() - INTERVAL '3 days',  12350, 12.0,  72.00, 6.00, 'Cb Santos'),
    (4, NOW() - INTERVAL '1 day',   78850, 60.0, 360.00, 6.00, 'Cb Santos'),
    (5, NOW() - INTERVAL '5 days',   3150,  8.0,  48.00, 6.00, 'Cb Santos');

-- Gastos financeiros de exemplo
INSERT INTO gastos_financeiros (viatura_id, categoria, descricao, data, valor, mes, ano, responsavel) VALUES
    (1, 'combustivel', 'Abastecimento Sprinter',          NOW() - INTERVAL '2 days',  270.00, EXTRACT(MONTH FROM NOW())::INT, EXTRACT(YEAR FROM NOW())::INT, 'Cb Santos'),
    (2, 'combustivel', 'Abastecimento Honda CB 500',      NOW() - INTERVAL '3 days',   72.00, EXTRACT(MONTH FROM NOW())::INT, EXTRACT(YEAR FROM NOW())::INT, 'Cb Santos'),
    (3, 'manutencao',  'Revisão preventiva Lander',       NOW() - INTERVAL '5 days',  850.00, EXTRACT(MONTH FROM NOW())::INT, EXTRACT(YEAR FROM NOW())::INT, 'Sgt Silva'),
    (3, 'peca',        'Filtro de ar e vela de ignição',  NOW() - INTERVAL '5 days',  120.00, EXTRACT(MONTH FROM NOW())::INT, EXTRACT(YEAR FROM NOW())::INT, 'Sgt Silva'),
    (1, 'manutencao',  'Troca correia dentada Sprinter',  NOW() - INTERVAL '15 days', 1200.00, EXTRACT(MONTH FROM NOW())::INT, EXTRACT(YEAR FROM NOW())::INT, 'Sgt Silva');

-- Defeitos de exemplo
INSERT INTO defeitos (viatura_id, tipo, descricao, severidade, status, data_relato, mecanico) VALUES
    (3, 'Motor',  'Consumo excessivo de óleo',          'alta',   'em_reparo',    NOW() - INTERVAL '8 days', 'Sgt Silva'),
    (4, 'Freios', 'Pedal de freio esponjoso',            'media',  'pendente',     NOW() - INTERVAL '2 days', NULL),
    (2, 'Elétrica','Sinaleira traseira com defeito',     'baixa',  'aguardando_peca', NOW() - INTERVAL '3 days', 'Sgt Silva');

-- Ordens de serviço de exemplo
INSERT INTO ordens_servico (numero_os, viatura_id, tipo_servico, status, prioridade, data_abertura, custo, mecanico) VALUES
    ('OS-2024-001', 3, 'Revisão geral + troca óleo motor',   'em_andamento', 'alta',   NOW() - INTERVAL '8 days', 850.00, 'Sgt Silva'),
    ('OS-2024-002', 4, 'Sangria do sistema de freios',       'aberta',       'normal', NOW() - INTERVAL '2 days', 0.00,   NULL),
    ('OS-2024-003', 2, 'Substituição sinaleira traseira',    'aguardando_peca','baixa', NOW() - INTERVAL '3 days', 0.00,   'Sgt Silva');

-- Alertas iniciais de exemplo
INSERT INTO alertas_automaticos (viatura_id, tipo, nivel, mensagem, lido) VALUES
    (3, 'manutencao',  'critico', '[AB-03] Revisão geral VENCIDA há 2 dias',           FALSE),
    (2, 'manutencao',  'aviso',   '[AB-02] Troca de óleo vence em 5 dias',              FALSE),
    (3, 'defeito',     'critico', '[AB-03] Defeito Motor sem reparo há 8 dias',         FALSE),
    (4, 'defeito',     'aviso',   '[UR-04] Defeito Freios registrado, verificar',       FALSE),
    (1, 'operacional', 'info',    '[UR-01] Kilometragem atualizada: 45.230 km',        TRUE);

-- Histórico de KM de exemplo
INSERT INTO historico_km (viatura_id, data, km, responsavel) VALUES
    (1, NOW() - INTERVAL '10 days', 44800.0, 'Cb Santos'),
    (1, NOW() - INTERVAL '2 days',  45100.0, 'Cb Santos'),
    (2, NOW() - INTERVAL '7 days',  12200.0, 'Cb Santos'),
    (2, NOW() - INTERVAL '3 days',  12350.0, 'Cb Santos'),
    (4, NOW() - INTERVAL '1 day',   78950.0, 'Cb Santos');
