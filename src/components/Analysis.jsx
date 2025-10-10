import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './analysis.css';

function Analysis() {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  
  const navigate = useNavigate();
  

  const user = useMemo(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }, []);


  const fetchAnalysisData = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        params.append('range', dateRange);
      }

      console.log(`🔍 Haciendo petición a: /api/analysis/${user.userId}?${params}`);

      const response = await fetch(
        `http://localhost:5001/api/analysis/${user.userId}?${params}`
      );
      
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Datos recibidos:', data);
        setMovements(data.movements || []);
        setCategories(data.categories || []);
      } else {
        console.error('❌ Error en respuesta:', data);
        setError(data.error || 'Error al cargar análisis');
      }
    } catch (error) {
      console.error('❌ Error al obtener datos del análisis:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, dateRange]);


  useEffect(() => {
    if (!user) {
      console.log('🔄 Usuario no encontrado, redirigiendo a login');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.userId) {
      console.log('📊 Cargando datos de análisis...');
      fetchAnalysisData();
    }
  }, [user?.userId, dateRange, fetchAnalysisData]);

  const formatMoney = useCallback((amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  }, []);

  // NUEVA FUNCIÓN: Generar recomendaciones personalizadas con diferentes tonos
  const generarRecomendacionesPersonalizadas = useCallback((
    categoryExpenses, 
    savingsPercentage, 
    balance, 
    totalIncome,
    expenses,
    incomes
  ) => {
    const recomendaciones = [];
    const tonos = ['motivador', 'directo', 'humoristico', 'reflexivo'];
    let tonoIndex = 0;

    // 1. ANÁLISIS POR CATEGORÍAS CON DIFERENTES TONOS
    if (categoryExpenses.length > 0) {
      const topCategory = categoryExpenses[0];
      
      if (topCategory.percentage > 50) {
        const tono = tonos[tonoIndex % tonos.length];
        tonoIndex++;
        
        const mensajes = {
          motivador: `💪 Tu categoría '${topCategory.name}' representa el ${topCategory.percentage.toFixed(1)}% de tus gastos. ¡Puedes optimizar esto! Reduciendo un 15% ahorrarías ${formatMoney(topCategory.total * 0.15)} al mes.`,
          directo: `📊 '${topCategory.name}' consume el ${topCategory.percentage.toFixed(1)}% de tu presupuesto (${formatMoney(topCategory.total)}). Esto es significativo y merece atención.`,
          humoristico: `😅 '${topCategory.name}' se está comiendo más de la mitad de tu presupuesto. ¡Tu billetera pide negociar!`,
          reflexivo: `🤔 Observo que '${topCategory.name}' representa ${topCategory.percentage.toFixed(1)}% de tus gastos. ¿Está alineado con tus prioridades?`
        };
        
        recomendaciones.push({
          type: 'warning',
          emoji: '⚠️',
          message: mensajes[tono],
          tono
        });
      }

      // Análisis de segunda categoría más grande
      if (categoryExpenses.length > 1) {
        const secondCategory = categoryExpenses[1];
        if (secondCategory.percentage > 20) {
          const tono = tonos[tonoIndex % tonos.length];
          tonoIndex++;
          
          const ahorroPotencial = secondCategory.total * 0.1;
          const mensajes = {
            motivador: `🎯 Si reduces '${secondCategory.name}' un 10%, ahorrarías ${formatMoney(ahorroPotencial)} este período. ¡Cada peso cuenta!`,
            directo: `'${secondCategory.name}': ${formatMoney(secondCategory.total)} (${secondCategory.percentage.toFixed(1)}%). Considera alternativas más económicas.`,
            humoristico: `💸 '${secondCategory.name}' está pidiendo unas vacaciones de tu tarjeta. Reducir un 10% = ${formatMoney(ahorroPotencial)} extra.`,
            reflexivo: `💭 '${secondCategory.name}' suma ${formatMoney(secondCategory.total)}. ¿Hay formas de obtener el mismo valor con menos inversión?`
          };
          
          recomendaciones.push({
            type: 'info',
            emoji: '💡',
            message: mensajes[tono],
            tono
          });
        }
      }
    }

    // 2. MENSAJE CONDICIONAL SEGÚN BALANCE
    if (balance < 0) {
      const deficit = Math.abs(balance);
      recomendaciones.push({
        type: 'critical',
        emoji: '🚨',
        message: `Tu balance es negativo: ${formatMoney(deficit)}. Prioriza reducir gastos no esenciales. Pequeños ajustes en cada categoría pueden marcar la diferencia.`,
        tono: 'directo'
      });
    } else if (balance > 0 && savingsPercentage >= 20) {
      const tono = tonos[tonoIndex % tonos.length];
      tonoIndex++;
      
      const mensajes = {
        motivador: `🌟 ¡Increíble! Ahorraste ${formatMoney(balance)} (${savingsPercentage.toFixed(1)}% de tus ingresos). ¡Sigue así y considera invertir una parte!`,
        directo: `✅ Balance positivo: ${formatMoney(balance)}. Tasa de ahorro: ${savingsPercentage.toFixed(1)}%. Estás en el camino correcto.`,
        humoristico: `🎉 Tu billetera está feliz con ${formatMoney(balance)} extra. ¿Fondo de emergencia o capricho merecido?`,
        reflexivo: `💚 Has logrado ahorrar ${savingsPercentage.toFixed(1)}% de tus ingresos. ¿Cuál es tu próximo objetivo financiero?`
      };
      
      recomendaciones.push({
        type: 'success',
        emoji: '🎊',
        message: mensajes[tono],
        tono
      });
    } else if (balance > 0) {
      recomendaciones.push({
        type: 'neutral',
        emoji: '👍',
        message: `Balance positivo de ${formatMoney(balance)}. Con pequeños ajustes podrías aumentar tu ahorro al 15-20% recomendado.`,
        tono: 'reflexivo'
      });
    }

    // 3. ANÁLISIS DE AHORRO
    if (savingsPercentage < 10 && balance > 0) {
      const metaAhorro = totalIncome * 0.1;
      const necesitas = metaAhorro - balance;
      recomendaciones.push({
        type: 'warning',
        emoji: '📈',
        message: `Estás ahorrando ${savingsPercentage.toFixed(1)}%. Para llegar al 10% recomendado, necesitas reducir gastos en ${formatMoney(necesitas)}.`,
        tono: 'directo'
      });
    }

    // 4. ANÁLISIS DE FRECUENCIA DE GASTOS
    if (expenses.length > incomes.length * 3) {
      const tono = tonos[tonoIndex % tonos.length];
      const mensajes = {
        motivador: `💪 Tienes ${expenses.length} transacciones de gastos vs ${incomes.length} de ingresos. Consolidar compras podría ayudarte a controlar mejor tu presupuesto.`,
        directo: `📊 ${expenses.length} gastos registrados. Muchas transacciones pequeñas pueden dificultar el seguimiento. Considera planificar compras semanales.`,
        humoristico: `😅 Tu tarjeta tiene ${expenses.length} movimientos. ¿Qué tal si le das un descanso y planeas compras más grandes?`,
        reflexivo: `🤔 Patrón detectado: muchas transacciones pequeñas. ¿Te ayudaría planificar compras en menos ocasiones?`
      };
      
      recomendaciones.push({
        type: 'info',
        emoji: '🔍',
        message: mensajes[tono],
        tono
      });
    }

    // 5. PROMEDIO DE GASTOS ALTO
    const averageExpense = expenses.length > 0 ? 
      expenses.reduce((sum, mov) => sum + parseFloat(mov.amount), 0) / expenses.length : 0;
    
    if (averageExpense > totalIncome / expenses.length && expenses.length > 5) {
      recomendaciones.push({
        type: 'info',
        emoji: '💰',
        message: `Tu gasto promedio es ${formatMoney(averageExpense)}. Algunos gastos son elevados. Revisa si puedes negociar mejores precios o buscar alternativas.`,
        tono: 'directo'
      });
    }

    return recomendaciones;
  }, [formatMoney]);

  // NUEVA FUNCIÓN: Generar metas sugeridas
  const generarMetasSugeridas = useCallback((
    categoryExpenses,
    savingsPercentage,
    totalIncome,
    balance
  ) => {
    const metas = [];

    // Meta 1: Reducir categorías más grandes
    if (categoryExpenses.length > 0) {
      const topCategories = categoryExpenses.slice(0, 2);
      topCategories.forEach(cat => {
        if (cat.percentage > 15) {
          const reduccion = cat.total * 0.1;
          metas.push({
            tipo: 'reduccion',
            categoria: cat.name,
            actual: cat.total,
            meta: cat.total - reduccion,
            ahorro: reduccion,
            descripcion: `Reducir '${cat.name}' un 10%`
          });
        }
      });
    }

    // Meta 2: Aumentar ahorro si es bajo
    if (savingsPercentage < 15 && balance > 0) {
      const metaAhorro = totalIncome * 0.15;
      const necesario = metaAhorro - balance;
      if (necesario > 0) {
        metas.push({
          tipo: 'ahorro',
          categoria: 'Ahorro General',
          actual: balance,
          meta: metaAhorro,
          ahorro: necesario,
          descripcion: 'Alcanzar 15% de ahorro mensual'
        });
      }
    }

    // Meta 3: Balance positivo si es negativo
    if (balance < 0) {
      metas.push({
        tipo: 'balance',
        categoria: 'Balance General',
        actual: balance,
        meta: 0,
        ahorro: Math.abs(balance),
        descripcion: 'Lograr balance positivo'
      });
    }

    return metas;
  }, []);

  // NUEVA FUNCIÓN: Generar resumen emocional
  const generarResumenEmocional = useCallback((balance, totalIncome, savingsPercentage) => {
    const ratioAhorro = savingsPercentage;

    if (ratioAhorro > 25) {
      return {
        emoji: '🌟',
        titulo: 'Excelente Control Financiero',
        mensaje: 'Tu balance refleja disciplina y planificación. Estás construyendo un futuro financiero sólido.',
        clase: 'resumen-excelente'
      };
    } else if (ratioAhorro >= 15) {
      return {
        emoji: '💚',
        titulo: 'Estabilidad Financiera',
        mensaje: 'Tu balance refleja estabilidad. Sigue así y busca nuevas oportunidades para optimizar.',
        clase: 'resumen-estable'
      };
    } else if (ratioAhorro > 0) {
      return {
        emoji: '⚖️',
        titulo: 'Balance Ajustado',
        mensaje: 'Estás manteniendo el equilibrio, pero hay espacio para mejorar tu capacidad de ahorro.',
        clase: 'resumen-ajustado'
      };
    } else if (balance < 0) {
      return {
        emoji: '🔄',
        titulo: 'Momento de Ajustar',
        mensaje: 'Tu gasto está desequilibrado, pero puedes retomarlo. Pequeños cambios generan grandes resultados.',
        clase: 'resumen-atencion'
      };
    } else {
      return {
        emoji: '📊',
        titulo: 'En Equilibrio',
        mensaje: 'Estás gastando lo que ganas. Considera crear un margen de ahorro para imprevistos.',
        clase: 'resumen-neutro'
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="analysis-container">
        <div className="loading">Cargando análisis financiero...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchAnalysisData}>Reintentar</button>
        </div>
      </div>
    );
  }


  const incomes = movements.filter(mov => mov.type === 'income');
  const expenses = movements.filter(mov => mov.type === 'expense');
  

  const totalIncome = incomes.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
  const totalExpense = expenses.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
  
  const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
  const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
  
  const savingsAmount = totalIncome - totalExpense;
  const savingsPercentage = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
  
  const balance = totalIncome - totalExpense;
  let financialStatus = "Equilibrado";
  let statusClass = "neutral";
  
  if (balance > 0) {
    financialStatus = "Positivo";
    statusClass = "positive";
  } else if (balance < 0) {
    financialStatus = "Negativo";
    statusClass = "negative";
  }
  
  
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const categoryExpenses = expenseCategories.map(category => {
    const categoryMovements = expenses.filter(mov => mov.category_id === category.id);
    const categoryTotal = categoryMovements.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
    const categoryPercentage = totalExpense > 0 ? (categoryTotal / totalExpense) * 100 : 0;
    const categoryAverage = categoryMovements.length > 0 ? categoryTotal / categoryMovements.length : 0;
    
    return {
      id: category.id,
      name: category.name,
      total: categoryTotal,
      percentage: categoryPercentage,
      average: categoryAverage,
      count: categoryMovements.length
    };
  }).filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);


  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const categoryIncomes = incomeCategories.map(category => {
    const categoryMovements = incomes.filter(mov => mov.category_id === category.id);
    const categoryTotal = categoryMovements.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
    const categoryPercentage = totalIncome > 0 ? (categoryTotal / totalIncome) * 100 : 0;
    
    return {
      id: category.id,
      name: category.name,
      total: categoryTotal,
      percentage: categoryPercentage,
      count: categoryMovements.length
    };
  }).filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  // GENERAR DATOS NUEVOS
  const recomendacionesPersonalizadas = generarRecomendacionesPersonalizadas(
    categoryExpenses,
    savingsPercentage,
    balance,
    totalIncome,
    expenses,
    incomes
  );

  const metasSugeridas = generarMetasSugeridas(
    categoryExpenses,
    savingsPercentage,
    totalIncome,
    balance
  );

  const resumenEmocional = generarResumenEmocional(balance, totalIncome, savingsPercentage);

  return (
    <div className="analysis-container">
      <header className="analysis-header">
        <h2>Análisis Financiero</h2>
        <nav className="analysis-nav">
          <Link to="/dashboard">← Volver al Dashboard</Link>
        </nav>
      </header>

      {/* Filtro de fechas */}
      <div className="date-filter">
        <label>Período de análisis:</label>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="all">Todo el tiempo</option>
          <option value="month">Último mes</option>
          <option value="3months">Últimos 3 meses</option>
          <option value="6months">Últimos 6 meses</option>
          <option value="year">Último año</option>
        </select>
      </div>

      {movements.length === 0 ? (
        <div className="no-data">
          <p>No hay movimientos para analizar en el período seleccionado.</p>
          <Link to="/add-movement" className="btn-link">
            Agregar primer movimiento
          </Link>
        </div>
      ) : (
        <>
          {/* NUEVO: Resumen Emocional */}
          <div className="analysis-section">
            <div className={`resumen-emocional ${resumenEmocional.clase}`}>
              <div className="resumen-header">
                <span className="resumen-emoji">{resumenEmocional.emoji}</span>
                <h3>{resumenEmocional.titulo}</h3>
              </div>
              <p className="resumen-mensaje">{resumenEmocional.mensaje}</p>
            </div>
          </div>

          {/* Resumen general */}
          <div className="analysis-section">
            <h3>Resumen General</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="label">Total movimientos:</div>
                <div className="value">{movements.length}</div>
              </div>
              <div className="summary-item">
                <div className="label">Ingresos:</div>
                <div className="value">{incomes.length}</div>
              </div>
              <div className="summary-item">
                <div className="label">Gastos:</div>
                <div className="value">{expenses.length}</div>
              </div>
            </div>
          </div>

          {/* Promedios */}
          <div className="analysis-section">
            <h3>Promedios</h3>
            <div className="average-box">
              <div className="average-item">
                <div className="label">Ingreso promedio:</div>
                <div className="value income">{formatMoney(averageIncome)}</div>
              </div>
              <div className="average-item">
                <div className="label">Gasto promedio:</div>
                <div className="value expense">{formatMoney(averageExpense)}</div>
              </div>
            </div>
          </div>
          
          {/* Estado financiero */}
          <div className="analysis-section">
            <h3>Estado Financiero</h3>
            <div className="balance-box">
              <div className={`balance-status ${statusClass}`}>{financialStatus}</div>
              <div className="balance-details">
                <div className="balance-item">
                  <div className="label">Total Ingresos:</div>
                  <div className="value income">{formatMoney(totalIncome)}</div>
                </div>
                <div className="balance-item">
                  <div className="label">Total Gastos:</div>
                  <div className="value expense">{formatMoney(totalExpense)}</div>
                </div>
                <div className="balance-item balance-result">
                  <div className="label">Balance:</div>
                  <div className={`value ${statusClass}`}>{formatMoney(balance)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Capacidad de ahorro */}
          <div className="analysis-section">
            <h3>Capacidad de Ahorro</h3>
            <div className="savings-box">
              <div className="savings-bar-container">
                <div 
                  className={`savings-bar ${savingsPercentage < 0 ? 'negative' : ''}`}
                  style={{ width: `${Math.max(0, Math.min(100, Math.abs(savingsPercentage)))}%` }}
                ></div>
              </div>
              <div className={`savings-percentage ${savingsPercentage < 0 ? 'negative' : ''}`}>
                {savingsPercentage.toFixed(1)}%
              </div>
              <div className="savings-description">
                {savingsPercentage >= 20 
                  ? `¡Excelente! Estás ahorrando el ${savingsPercentage.toFixed(1)}% de tus ingresos`
                  : savingsPercentage >= 10 
                  ? `Bien, estás ahorrando el ${savingsPercentage.toFixed(1)}% de tus ingresos`
                  : savingsPercentage > 0 
                  ? `Estás ahorrando el ${savingsPercentage.toFixed(1)}% de tus ingresos, podrías mejorar`
                  : 'Tus gastos superan tus ingresos. Considera revisar tu presupuesto'}
              </div>
            </div>
          </div>

          {/* NUEVO: Mini Metas Sugeridas */}
          {metasSugeridas.length > 0 && (
            <div className="analysis-section">
              <h3>🎯 Metas Sugeridas</h3>
              <div className="metas-container">
                {metasSugeridas.map((meta, index) => (
                  <div key={index} className={`meta-card meta-${meta.tipo}`}>
                    <div className="meta-header">
                      <h4>{meta.descripcion}</h4>
                    </div>
                    <div className="meta-content">
                      <div className="meta-valores">
                        <div className="meta-actual">
                          <span className="meta-label">Actual:</span>
                          <span className="meta-monto">{formatMoney(meta.actual)}</span>
                        </div>
                        <span className="meta-flecha">→</span>
                        <div className="meta-objetivo">
                          <span className="meta-label">Meta:</span>
                          <span className="meta-monto">{formatMoney(meta.meta)}</span>
                        </div>
                      </div>
                      <div className="meta-ahorro">
                        <span className="meta-ahorro-label">
                          {meta.tipo === 'reduccion' ? 'Ahorro potencial:' : 
                           meta.tipo === 'balance' ? 'Reducir gastos en:' : 
                           'Necesitas ahorrar:'}
                        </span>
                        <span className="meta-ahorro-monto">{formatMoney(meta.ahorro)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Ingresos por categoría */}
          {categoryIncomes.length > 0 && (
            <div className="analysis-section">
              <h3>Ingresos por Categoría</h3>
              <div className="categories-list">
                {categoryIncomes.map(category => (
                  <div key={category.id} className="category-item income">
                    <div className="category-header">
                      <div className="category-name">
                        {category.name}
                        <span className="category-count">({category.count} movimientos)</span>
                      </div>
                      <div className="category-amount">
                        {formatMoney(category.total)}
                        <span className="category-percent">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar income"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gastos por categoría */}
          {categoryExpenses.length > 0 && (
            <div className="analysis-section">
              <h3>Gastos por Categoría</h3>
              <div className="categories-list">
                {categoryExpenses.map(category => (
                  <div key={category.id} className="category-item expense">
                    <div className="category-header">
                      <div className="category-name">
                        {category.name}
                        <span className="category-count">({category.count} movimientos)</span>
                      </div>
                      <div className="category-amount">
                        {formatMoney(category.total)}
                        <span className="category-percent">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar expense"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="category-details">
                      <small>Promedio: {formatMoney(category.average)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEJORADO: Recomendaciones Personalizadas */}
          <div className="analysis-section">
            <h3>💡 Recomendaciones Personalizadas</h3>
            <div className="recommendations">
              {recomendacionesPersonalizadas.map((rec, index) => (
                <div key={index} className={`recommendation ${rec.type}`}>
                  <span className="rec-emoji">{rec.emoji}</span>
                  <span className="rec-message">{rec.message}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analysis;