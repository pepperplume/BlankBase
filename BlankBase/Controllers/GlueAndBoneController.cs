using Microsoft.AspNetCore.Mvc;

namespace BlankBase.Controllers
{
    public class GlueAndBoneController : Controller
    {
        public IActionResult Index()
        {
            // Demo data - server-rendered items
            var demoItems = new[]
            {
                new { Id = 1, Name = "Alice Johnson", Role = "Developer", IsActive = true },
                new { Id = 2, Name = "Bob Smith", Role = "Designer", IsActive = true },
                new { Id = 3, Name = "Carol White", Role = "Manager", IsActive = false }
            };

            return View(demoItems);
        }

        [HttpPost]
        public IActionResult Delete(int id)
        {
            // In real app, delete from database
            // For demo, just return success
            return Json(new { success = true, message = $"Item {id} deleted successfully!" });
        }

        public IActionResult noiselessDemo()
        {
            return View();
        }
    }
}
